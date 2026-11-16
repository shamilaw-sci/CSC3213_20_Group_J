package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderStatusUpdateRequest {
    @NotNull(message = "Order status is required")
    private OrderStatus status;

    @jakarta.validation.constraints.Size(max = 500, message = "The tracking note must be at most 500 characters")
    private String note;
}
