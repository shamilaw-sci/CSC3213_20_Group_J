package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.DeliveryType;
import com.icrowd_api.features.order.PaymentMethod;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    
    // Shipping Details
    private String shippingFullName;
    private String shippingPhone;
    private String shippingEmail;
    private String shippingAddress;
    private String shippingDistrict;
    private Double shippingLat;
    private Double shippingLng;
    private DeliveryType deliveryType;

    // Payment
    private PaymentMethod paymentMethod;

    // Cart Items
    private List<CheckoutItemDto> items;

    // Promo Code (optional — null/empty when no code was applied)
    private String promoCode;
}
