package com.icrowd_api.features.cart.dto;

import lombok.Data;
import java.util.List;

@Data
public class CartSyncRequest {
    private List<CartSyncItemDto> items;
}
