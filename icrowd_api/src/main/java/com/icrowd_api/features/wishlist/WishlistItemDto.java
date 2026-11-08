package com.icrowd_api.features.wishlist;

import com.icrowd_api.features.cart.dto.CartProductResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {
    private Long id;
    private CartProductResponseDto product;
    private LocalDateTime createdAt;

    public static WishlistItemDto fromEntity(WishlistItem item) {
        if (item == null) return null;
        return WishlistItemDto.builder()
                .id(item.getId())
                .product(CartProductResponseDto.fromEntity(item.getProduct()))
                .createdAt(item.getCreatedAt())
                .build();
    }
}

