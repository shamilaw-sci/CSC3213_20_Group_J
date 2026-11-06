package com.icrowd_api.features.order.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
public class CheckoutItemDto {
    @NotNull @Positive
    private Long productId;
    @NotNull @Positive
    private Integer quantity;
}
