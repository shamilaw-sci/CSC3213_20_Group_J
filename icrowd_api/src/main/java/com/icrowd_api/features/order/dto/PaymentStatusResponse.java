package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.OrderStatus;
import com.icrowd_api.features.order.PaymentMethod;
import com.icrowd_api.features.order.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private Long unavailableProductId;
    private String unavailableProductName;
    private java.util.List<ValidatedItemDto> items;
    private Long orderId;
    private String orderReference;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private BigDecimal subTotal;
    private BigDecimal discount;
    private BigDecimal shippingCost;
    private BigDecimal totalAmount;
    private String currency;
    private String estimatedDelivery;
    private String shippingFullName;
    private String shippingAddress;
    private String shippingDistrict;
}
