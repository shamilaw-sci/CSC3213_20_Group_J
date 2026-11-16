package com.icrowd_api.features.cart.dto;

import com.icrowd_api.features.product.Product;
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
public class CartProductResponseDto {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer availableStock;
    private List<String> imageUrls;
    private Boolean isActive;
    private CartCategoryResponseDto category;

    public static CartProductResponseDto fromEntity(Product product) {
        if (product == null) return null;
        CartCategoryResponseDto catDto = null;
        if (product.getCategory() != null) {
            catDto = CartCategoryResponseDto.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .build();
        }
        return CartProductResponseDto.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .availableStock(product.getAvailableStock())
                .imageUrls(product.getImageUrls())
                .isActive(product.getIsActive())
                .category(catDto)
                .build();
    }
}

