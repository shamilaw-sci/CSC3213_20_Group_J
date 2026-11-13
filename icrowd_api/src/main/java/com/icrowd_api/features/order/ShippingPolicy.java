package com.icrowd_api.features.order;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Shared authoritative policy source for delivery fees, timelines, warranties, and payment methods.
 * Ensures consistent information across the checkout flow, order service, and AI chatbot.
 */
@Component
public class ShippingPolicy {

    public static final BigDecimal STANDARD_DELIVERY_FEE = new BigDecimal("200.00");
    public static final String STANDARD_DELIVERY_TIMELINE = "3-5 Business Days";

    public static final BigDecimal FAST_DELIVERY_FEE = new BigDecimal("500.00");
    public static final String FAST_DELIVERY_TIMELINE = "1-2 Business Days";

    public static final String WARRANTY_POLICY = "1 Year Official Brand Warranty with 7-Day Instant Replacement Guarantee.";
    public static final String PAYMENT_POLICY = "Cash on Delivery (COD), Visa / MasterCard (Online Payment), and Direct Bank Transfer.";

    public BigDecimal getDeliveryFee(DeliveryType type) {
        if (type == DeliveryType.FAST) {
            return FAST_DELIVERY_FEE;
        }
        return STANDARD_DELIVERY_FEE;
    }

    public String getEstimatedDelivery(DeliveryType type) {
        if (type == DeliveryType.FAST) {
            return FAST_DELIVERY_TIMELINE;
        }
        return STANDARD_DELIVERY_TIMELINE;
    }
}

