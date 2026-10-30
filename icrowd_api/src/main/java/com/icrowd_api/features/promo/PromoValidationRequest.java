package com.icrowd_api.features.promo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PromoValidationRequest {

    /** The promo code string entered by the customer. */
    private String code;

    /** The current cart subtotal (before shipping and discount). */
    private BigDecimal cartSubTotal;
}
