package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.order.dto.CheckoutItemDto;
import com.icrowd_api.features.order.dto.CheckoutRequest;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

            // Basic stock check (will be replaced by atomic query in next phase)
            if (product.getAvailableStock() < itemDto.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
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
        order.setTotalAmount(subTotal.add(shippingCost));

        return orderRepository.save(order);
    }
    
    @Transactional
    public void updateReceiptUrl(Long orderId, String receiptUrl) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setReceiptUrl(receiptUrl);
        orderRepository.save(order);
    }
}
