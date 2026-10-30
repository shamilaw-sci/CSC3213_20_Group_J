package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.DeliveryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingValidationResponse {
    private boolean valid;
    private BigDecimal subTotal;
    private BigDecimal discount;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private DeliveryType deliveryType;
    private String estimatedDelivery;
    private List<ValidatedItemDto> items;
    private Long savedAddressId;
    private String message;
}
