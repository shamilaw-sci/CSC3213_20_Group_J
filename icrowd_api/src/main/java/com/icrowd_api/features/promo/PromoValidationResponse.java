package com.icrowd_api.features.promo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoValidationResponse {

    /** Whether the code is valid and applicable. */
    private boolean valid;

    /** Human-readable success or error message. */
    private String message;

    /** The code string that was validated (for display). */
    private String promoCode;

    /** Discount amount to deduct from the subtotal. */
    private BigDecimal discountAmount;

    /** Subtotal after applying the discount (before shipping). */
    private BigDecimal discountedSubTotal;
}
