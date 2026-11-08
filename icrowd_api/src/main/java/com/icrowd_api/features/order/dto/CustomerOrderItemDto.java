package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderItemDto {
    private Long id;
    private Long productId;
    private String title;
    private Integer quantity;
    private BigDecimal price;
    private String imageUrl;

    public static CustomerOrderItemDto fromEntity(OrderItem item) {
        if (item == null) return null;
        String name = "Item";
        String img = "";
        Long pId = null;
        if (item.getProduct() != null) {
            pId = item.getProduct().getId();
            name = item.getProduct().getName();
            if (item.getProduct().getImageUrls() != null && !item.getProduct().getImageUrls().isEmpty()) {
                img = item.getProduct().getImageUrls().get(0);
            }
        }
        return CustomerOrderItemDto.builder()
                .id(item.getId())
                .productId(pId)
                .title(name)
                .quantity(item.getQuantity())
                .price(item.getPriceAtTimeOfPurchase())
                .imageUrl(img)
                .build();
    }
}

