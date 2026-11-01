package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.order.dto.CheckoutItemDto;
import com.icrowd_api.features.order.dto.CheckoutRequest;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.promo.PromoCodeService;
import com.icrowd_api.features.promo.PromoValidationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PromoCodeService promoCodeService;

    @Transactional
    public Order createOrder(String email, CheckoutRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = Order.builder()
                .user(user)
                .status(request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER ? OrderStatus.PENDING : OrderStatus.PROCESSING)
                .shippingFullName(request.getShippingFullName())
                .shippingPhone(request.getShippingPhone())
                .shippingEmail(request.getShippingEmail())
                .shippingAddress(request.getShippingAddress())
                .shippingDistrict(request.getShippingDistrict())
                .shippingLat(request.getShippingLat())
                .shippingLng(request.getShippingLng())
                .deliveryType(request.getDeliveryType())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        BigDecimal subTotal = BigDecimal.ZERO;

        for (CheckoutItemDto itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemDto.getProductId()));

            // Execute atomic decrement
            int rowsUpdated = productRepository.atomicDecrementStock(product.getId(), itemDto.getQuantity());
            if (rowsUpdated == 0) {
                // The decrement failed because availableStock < quantity, or product didn't exist
                throw new OutOfStockException(product.getId(), product.getName());
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .priceAtTimeOfPurchase(product.getPrice())
                    .build();

            order.getItems().add(orderItem);

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            subTotal = subTotal.add(itemTotal);
        }

        order.setSubTotal(subTotal);

        // Simple shipping logic for now
        BigDecimal shippingCost = request.getDeliveryType() == DeliveryType.FAST
            ? new BigDecimal("500.00")
            : new BigDecimal("200.00");

        order.setShippingCost(shippingCost);

        // Apply promo code discount if provided
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (StringUtils.hasText(request.getPromoCode())) {
            PromoValidationResponse validation =
                    promoCodeService.validateCode(request.getPromoCode(), email, subTotal);
            if (validation.isValid()) {
                discountAmount = validation.getDiscountAmount();
                order.setDiscountAmount(discountAmount);
                // appliedPromoCode FK is set inside applyCodeToOrder below (after save)
            }
            // If the code is somehow invalid at checkout time we silently skip it
            // (the frontend already validated; this is a last-resort guard)
        }

        order.setTotalAmount(subTotal.subtract(discountAmount).add(shippingCost).max(BigDecimal.ZERO));

        Order savedOrder = orderRepository.save(order);

        // Record promo usage AFTER the order is persisted so the FK is valid
        if (StringUtils.hasText(request.getPromoCode()) && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            promoCodeService.applyCodeToOrder(request.getPromoCode(), user, savedOrder);
        }

        return savedOrder;
    }

    @Transactional
    public void updateReceiptUrl(Long orderId, String receiptUrl) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setReceiptUrl(receiptUrl);
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Order findById(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }
}
