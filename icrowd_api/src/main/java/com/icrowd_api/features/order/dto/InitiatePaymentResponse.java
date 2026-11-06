package com.icrowd_api.features.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentResponse {
    private String internalPaymentId;
    private String checkoutUrl;
    private java.util.Map<String,String> checkoutFields;
    private Long orderId;
    private String orderReference;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String status;
}
