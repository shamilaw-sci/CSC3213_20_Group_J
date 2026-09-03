package com.icrowd_api.features.order.dto;

import lombok.Data;

@Data
public class CheckoutItemDto {
    private Long productId;
    private Integer quantity;
}
