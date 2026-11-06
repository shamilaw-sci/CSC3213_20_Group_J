package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.auth.UserService;
import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.order.dto.*;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.promo.PromoCodeService;
import com.icrowd_api.features.promo.PromoValidationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class OrderService {
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private StockAllocationService stockAllocationService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PromoCodeService promoCodeService;

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+?94|0)?[0-9]{9,10}$");

    /**
     * Phase 1: Validates shipping information, verifies product availability and stock,
     * calculates server-trusted subtotal, discounts, delivery fees, and order total.
     * Does NOT create an order in the database or mutate stock.
     */
    @Transactional
    public ShippingValidationResponse validateShippingAndCalculate(String email, ShippingValidationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Shipping request cannot be null");
        }

        if (request.getRecipientName() == null || request.getRecipientName().trim().length() < 2) {
            throw new IllegalArgumentException("Recipient full name must be at least 2 characters long.");
        }

        if (request.getPhone() == null || !PHONE_PATTERN.matcher(request.getPhone().trim().replaceAll("[\\s-]", "")).matches()) {
            throw new IllegalArgumentException("Please enter a valid phone number (e.g., 0712345678 or +94712345678).");
        }

        if (request.getAddress() == null || request.getAddress().trim().length() < 3) {
            throw new IllegalArgumentException("Please provide a valid street address.");
        }

        if (request.getDistrict() == null || request.getDistrict().trim().isEmpty()) {
            throw new IllegalArgumentException("Please select a delivery district.");
        }

        if (request.getDeliveryType() == null) {
            throw new IllegalArgumentException("Delivery method is required.");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty for checkout validation.");
        }

        if (request.getLatitude() != null && (request.getLatitude() < -90.0 || request.getLatitude() > 90.0)) {
            throw new IllegalArgumentException("Invalid latitude value.");
        }
        if (request.getLongitude() != null && (request.getLongitude() < -180.0 || request.getLongitude() > 180.0)) {
            throw new IllegalArgumentException("Invalid longitude value.");
        }

        BigDecimal subTotal = BigDecimal.ZERO;
        List<ValidatedItemDto> validatedItems = new ArrayList<>();

        for (CheckoutItemDto itemDto : request.getItems()) {
            if (itemDto.getProductId() == null || itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                throw new IllegalArgumentException("Invalid product item in checkout.");
            }

            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemDto.getProductId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new IllegalArgumentException("Product is currently unavailable: " + product.getName());
            }

            if (product.getAvailableStock() < itemDto.getQuantity()) {
                throw new OutOfStockException(product.getId(), product.getName());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            subTotal = subTotal.add(lineTotal);

            String imageUrl = (product.getImageUrls() != null && !product.getImageUrls().isEmpty())
                    ? product.getImageUrls().get(0)
                    : null;

            validatedItems.add(ValidatedItemDto.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .sku(product.getSku())
                    .unitPrice(unitPrice.setScale(2, RoundingMode.HALF_UP))
                    .quantity(itemDto.getQuantity())
                    .lineTotal(lineTotal.setScale(2, RoundingMode.HALF_UP))
                    .imageUrl(imageUrl)
                    .build());
        }

        BigDecimal deliveryFee = request.getDeliveryType() == DeliveryType.FAST
                ? new BigDecimal("500.00")
                : new BigDecimal("200.00");

        String estimatedDelivery = request.getDeliveryType() == DeliveryType.FAST
                ? "1-2 Business Days"
                : "3-5 Business Days";

        BigDecimal discount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subTotal.subtract(discount).add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        Long savedAddressId = null;
        if (email != null && Boolean.TRUE.equals(request.getSaveAddress())) {
            try {
                AddressDto newAddress = AddressDto.builder()
                        .recipientName(request.getRecipientName().trim())
                        .phone(request.getPhone().trim())
                        .address(request.getAddress().trim())
                        .addressLine1(request.getAddress().trim())
                        .city(request.getDistrict().trim())
                        .district(request.getDistrict().trim())
                        .label(request.getAddressLabel() != null && !request.getAddressLabel().isBlank() ? request.getAddressLabel().trim() : "HOME")
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .isDefault(false)
                        .build();

                AddressDto saved = userService.addCustomerAddress(email, newAddress);
                if (saved != null) {
                    savedAddressId = saved.getId();
                }
            } catch (Exception ex) {
                System.err.println("Failed to auto-save customer address during checkout: " + ex.getMessage());
            }
        }

        return ShippingValidationResponse.builder()
                .valid(true)
                .subTotal(subTotal.setScale(2, RoundingMode.HALF_UP))
                .discount(discount)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .deliveryType(request.getDeliveryType())
                .estimatedDelivery(estimatedDelivery)
                .items(validatedItems)
                .savedAddressId(savedAddressId)
                .message("Shipping information and pricing validated successfully.")
                .build();
    }

    /**
     * Phase 4: Create order with trusted pricing and atomic stock reservation.
     * Card & Online Bank Transfer initialize as PENDING_PAYMENT / PENDING.
     * Cash on Delivery initializes as CONFIRMED / DUE_ON_DELIVERY.
     */
    @Transactional
    public CreateOrderResponse createNewOrder(String email, CreateOrderRequest request) {
        User user = userRepository.findForCheckout(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER)
            throw new IllegalArgumentException("Online bank transfer is not currently supported");
        if (request.getPaymentMethod() == null || request.getDeliveryType() == null)
            throw new IllegalArgumentException("Payment and delivery method are required");
        if (request.getItems() == null || request.getItems().isEmpty())
            throw new IllegalArgumentException("Cart cannot be empty");
        for (CheckoutItemDto item : request.getItems()) {
            if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0)
                throw new IllegalArgumentException("Product and positive quantity are required");
        }
        if (request.getCheckoutKey() != null) {
            var existing = orderRepository.findByUserIdAndCheckoutKey(user.getId(), request.getCheckoutKey());
            if (existing.isPresent()) {
                if (request.getPaymentMethod() == PaymentMethod.COD && existing.get().getPaymentMethod() == PaymentMethod.CARD)
                    return switchToCod(email, existing.get().getId());
                if (existing.get().getPaymentMethod() != request.getPaymentMethod())
                    throw new IllegalArgumentException("An order already exists for this checkout. Continue with its payment method.");
                return orderResponse(existing.get());
            }
        }

        if (request.getShippingPhone() != null &&
                !PHONE_PATTERN.matcher(request.getShippingPhone().trim().replaceAll("[\\s-]", "")).matches()) {
            throw new IllegalArgumentException("Invalid phone number format.");
        }

        OrderStatus initialOrderStatus;
        PaymentStatus initialPaymentStatus;

        if (request.getPaymentMethod() == PaymentMethod.COD) {
            initialOrderStatus = OrderStatus.CONFIRMED;
            initialPaymentStatus = PaymentStatus.DUE_ON_DELIVERY;
        } else {
            initialOrderStatus = OrderStatus.PENDING_PAYMENT;
            initialPaymentStatus = PaymentStatus.PENDING;
        }

        Order order = Order.builder()
                .checkoutKey(request.getCheckoutKey())
                .user(user)
                .status(initialOrderStatus)
                .shippingFullName(request.getShippingFullName())
                .shippingPhone(request.getShippingPhone())
                .shippingEmail(request.getShippingEmail())
                .shippingAddress(request.getShippingAddress())
                .shippingDistrict(request.getShippingDistrict())
                .shippingLat(request.getShippingLat())
                .shippingLng(request.getShippingLng())
                .deliveryType(request.getDeliveryType())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(initialPaymentStatus)
                .currency("LKR")
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        BigDecimal subTotal = BigDecimal.ZERO;

        for (CheckoutItemDto itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemDto.getProductId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new IllegalArgumentException("Product is currently unavailable: " + product.getName());
            }

            // Pending online orders do not reserve inventory.

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .priceAtTimeOfPurchase(product.getPrice())
                    .build();

            order.getItems().add(orderItem);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            subTotal = subTotal.add(lineTotal);
        }

        BigDecimal discount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (StringUtils.hasText(request.getPromoCode())) {
            PromoValidationResponse validation = promoCodeService.validateCode(request.getPromoCode(), email, subTotal);
            if (!validation.isValid()) throw new IllegalArgumentException(validation.getMessage());
            discount = validation.getDiscountAmount();
        }
        order.setDiscountAmount(discount);

        BigDecimal shippingCost = request.getDeliveryType() == DeliveryType.FAST
                ? new BigDecimal("500.00")
                : new BigDecimal("200.00");

        BigDecimal totalAmount = subTotal.subtract(discount).add(shippingCost).setScale(2, RoundingMode.HALF_UP);

        order.setSubTotal(subTotal.setScale(2, RoundingMode.HALF_UP));
        order.setDiscount(discount);
        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);

        if (request.getPaymentMethod() == PaymentMethod.COD && !stockAllocationService.allocate(order)) {
            throw new OutOfStockException(order.getUnavailableProductId(), order.getUnavailableProductName());
        }
        // Save order
        Order savedOrder = orderRepository.save(order);

        if (StringUtils.hasText(request.getPromoCode()) && discount.signum() > 0) {
            promoCodeService.applyCodeToOrder(request.getPromoCode(), user, savedOrder);
        }

        // Generate clean human-readable reference: ORD-YYYYMMDD-ID
        String orderRef = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%05d", savedOrder.getId());
        savedOrder.setOrderReference(orderRef);
        savedOrder = orderRepository.save(savedOrder);

        return orderResponse(savedOrder);
    }

    @Transactional
    public CreateOrderResponse switchToCod(String email, Long orderId) {
        // Use the same order lock as payment initiation and provider notifications.
        Order order = orderRepository.findForUpdate(orderId).orElseThrow();
        if (!order.getUser().getEmail().equalsIgnoreCase(email))
            throw new IllegalArgumentException("Access denied");
        if (order.getPaymentMethod() == PaymentMethod.COD && order.isStockAllocated()
                && order.getPaymentStatus() == PaymentStatus.DUE_ON_DELIVERY)
            return orderResponse(order);
        var attempts = paymentRepository.findByOrderId(orderId);
        boolean isFailedCardPayment = order.getStatus() == OrderStatus.FAILED
                && order.getPaymentStatus() == PaymentStatus.FAILED
                && !attempts.isEmpty()
                && attempts.stream().allMatch(p -> p.getStatus() == PaymentStatus.FAILED);
        boolean isUninitiatedCardPayment = order.getStatus() == OrderStatus.PENDING_PAYMENT
                && attempts.isEmpty();

        if (order.getPaymentMethod() != PaymentMethod.CARD || order.isStockAllocated()
                || (!isFailedCardPayment && !isUninitiatedCardPayment))
            throw new IllegalArgumentException("Switching to COD requires a confirmed failed card payment. Pending payments must be verified first.");
        if (!stockAllocationService.allocate(order))
            throw new OutOfStockException(order.getUnavailableProductId(), order.getUnavailableProductName());
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.DUE_ON_DELIVERY);
        order.setStatus(OrderStatus.CONFIRMED);
        return orderResponse(order);
    }

    private CreateOrderResponse orderResponse(Order savedOrder) {
        String estimatedDelivery = savedOrder.getDeliveryType() == DeliveryType.FAST
                ? "1-2 Business Days"
                : "3-5 Business Days";

        return CreateOrderResponse.builder()
                .orderId(savedOrder.getId())
                .orderReference(savedOrder.getOrderReference())
                .orderStatus(savedOrder.getStatus())
                .paymentStatus(savedOrder.getPaymentStatus())
                .paymentMethod(savedOrder.getPaymentMethod())
                .subTotal(savedOrder.getSubTotal())
                .discount(savedOrder.getDiscount())
                .shippingCost(savedOrder.getShippingCost())
                .totalAmount(savedOrder.getTotalAmount())
                .currency(savedOrder.getCurrency())
                .estimatedDelivery(estimatedDelivery)
                .build();
    }

    /**
     * Phase 7: Retrieve order and payment status for frontend verification / polling.
     */
    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Long orderId, String email) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        if (!order.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new RuntimeException("Access denied: You do not have permission to view order #" + orderId);
        }

        String estimatedDelivery = order.getDeliveryType() == DeliveryType.FAST
                ? "1-2 Business Days"
                : "3-5 Business Days";

        return PaymentStatusResponse.builder()
                .unavailableProductId(order.getUnavailableProductId())
                .unavailableProductName(order.getUnavailableProductName())
                .items(order.getItems().stream().map(item -> ValidatedItemDto.builder()
                    .productId(item.getProduct().getId()).quantity(item.getQuantity()).build()).toList())
                .orderId(order.getId())
                .orderReference(order.getOrderReference())
                .orderStatus(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .subTotal(order.getSubTotal())
                .discount(order.getDiscount())
                .shippingCost(order.getShippingCost())
                .totalAmount(order.getTotalAmount())
                .currency(order.getCurrency())
                .estimatedDelivery(estimatedDelivery)
                .shippingFullName(order.getShippingFullName())
                .shippingAddress(order.getShippingAddress())
                .shippingDistrict(order.getShippingDistrict())
                .build();
    }

    /**
     * Releases stock when a payment fails or is cancelled.
     */
    @Transactional
    public void releaseOrderStock(Order order) {
        if (order != null && order.isStockAllocated() && order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                productRepository.atomicIncrementStock(item.getProduct().getId(), item.getQuantity());
            }
            order.setStockAllocated(false);
        }
    }

    // ─── Legacy createOrder method for backward compatibility ─────────────────
    @Transactional
    public Order createOrder(String email, CheckoutRequest request) {
        CreateOrderRequest newReq = CreateOrderRequest.builder()
                .promoCode(request.getPromoCode())
                .shippingFullName(request.getShippingFullName())
                .shippingPhone(request.getShippingPhone())
                .shippingEmail(request.getShippingEmail())
                .shippingAddress(request.getShippingAddress())
                .shippingDistrict(request.getShippingDistrict())
                .shippingLat(request.getShippingLat())
                .shippingLng(request.getShippingLng())
                .deliveryType(request.getDeliveryType())
                .paymentMethod(request.getPaymentMethod())
                .items(request.getItems())
                .build();

        CreateOrderResponse res = createNewOrder(email, newReq);
        return orderRepository.findById(res.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found after creation"));
    }

    @Transactional
    public void updateReceiptUrl(Long orderId, String receiptUrl) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setReceiptUrl(receiptUrl);
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Order findById(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }
}
