package com.icrowd_api.features.promo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PromoCodeRequest {

    /** The unique promo code string (e.g. WELCOME15). */
    private String code;

    /** PERCENTAGE or FIXED */
    private DiscountType discountType;

    /** Percentage value (e.g. 15.00) or fixed amount (e.g. 500.00) */
    private BigDecimal discountValue;

    /** Maximum LKR discount for PERCENTAGE type (optional). */
    private BigDecimal maxDiscountAmount;

    /** Minimum cart subtotal required to use this code (optional). */
    private BigDecimal minimumOrderAmount;

    /** Date when the code becomes active (null = immediately). */
    private LocalDate startDate;

    /** Date when the code expires (null = never). */
    private LocalDate expiryDate;

    /** Maximum total redemptions across all customers (null = unlimited). */
    private Integer totalUsageLimit;

    /** Maximum redemptions per individual customer (null = unlimited). */
    private Integer perCustomerLimit;

    /** ALL | NEW_CUSTOMERS | SELECTED_CUSTOMERS */
    private CustomerEligibility customerEligibility;

    /**
     * Required when customerEligibility == SELECTED_CUSTOMERS.
     * List of customer email addresses allowed to use the code.
     */
    private List<String> eligibleCustomerEmails;
}
