package com.icrowd_api.features.cart.dto;

import com.icrowd_api.features.cart.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponseDto {
    private Long id;
    private CartProductResponseDto product;
    private Integer quantity;

    public static CartItemResponseDto fromEntity(CartItem item) {
        if (item == null) return null;
        return CartItemResponseDto.builder()
                .id(item.getId())
                .product(CartProductResponseDto.fromEntity(item.getProduct()))
                .quantity(item.getQuantity())
                .build();
    }
}

