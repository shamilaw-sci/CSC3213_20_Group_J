package com.icrowd_api.features.promo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "promo_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    /** Cap for PERCENTAGE discounts (e.g. max LKR 2000 off) */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    /** Minimum cart subtotal required to apply this code */
    @Column(precision = 10, scale = 2)
    private BigDecimal minimumOrderAmount;

    /** When the code becomes valid (null = immediately) */
    private LocalDate startDate;

    /** When the code expires (null = never) */
    private LocalDate expiryDate;

    /** How many times the code can be used in total (null = unlimited) */
    private Integer totalUsageLimit;

    /** How many times a single customer can use the code (null = unlimited) */
    private Integer perCustomerLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CustomerEligibility customerEligibility = CustomerEligibility.ALL;

    /**
     * For SELECTED_CUSTOMERS: comma-separated emails stored in a separate table.
     * Using @ElementCollection for simplicity — no extra entity class needed.
     */
    @ElementCollection
    @CollectionTable(name = "promo_eligible_emails", joinColumns = @JoinColumn(name = "promo_id"))
    @Column(name = "email")
    @Builder.Default
    private List<String> eligibleCustomerEmails = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    private int usageCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
