package com.icrowd_api.features.cart.dto;

import com.icrowd_api.features.cart.Cart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDto {
    private Long id;
    private List<CartItemResponseDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CartResponseDto fromEntity(Cart cart) {
        if (cart == null) return null;
        List<CartItemResponseDto> itemDtos = cart.getItems() == null
                ? Collections.emptyList()
                : cart.getItems().stream()
                        .map(CartItemResponseDto::fromEntity)
                        .collect(Collectors.toList());

        return CartResponseDto.builder()
                .id(cart.getId())
                .items(itemDtos)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}

