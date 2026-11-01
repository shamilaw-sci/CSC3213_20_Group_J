package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.promo.PromoCode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Convert(converter = OrderStatusConverter.class)
    @Column(nullable = false)
    private OrderStatus status;

    // Shipping Details
    private String shippingFullName;
    private String shippingPhone;
    private String shippingEmail;
    private String shippingAddress;
    private String shippingDistrict;
    
    // Map Coordinates (optional for mock, but good to have)
    private Double shippingLat;
    private Double shippingLng;

    @Convert(converter = DeliveryTypeConverter.class)
    @Column(nullable = false)
    private DeliveryType deliveryType;

    // Pricing
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingCost;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subTotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Payment
    @Convert(converter = PaymentMethodConverter.class)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Convert(converter = PaymentStatusConverter.class)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    private String receiptUrl; // For Bank Transfer

    // Promo Code (optional — null when no code was applied)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_code_id")
    private PromoCode appliedPromoCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();


    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
