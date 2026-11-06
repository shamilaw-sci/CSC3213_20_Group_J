package com.icrowd_api.features.promo;

public class PromoCodeNotFoundException extends RuntimeException {
    public PromoCodeNotFoundException(Long id) {
        super("Promo code not found with id: " + id);
    }
    public PromoCodeNotFoundException(String code) {
        super("Promo code not found: " + code);
    }
}
