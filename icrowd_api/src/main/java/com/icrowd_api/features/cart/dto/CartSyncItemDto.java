package com.icrowd_api.features.cart.dto;

import lombok.Data;

@Data
public class CartSyncItemDto {
    private Long productId;
    private Integer quantity;
}
