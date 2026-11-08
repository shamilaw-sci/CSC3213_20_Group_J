package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.Order;
import com.icrowd_api.features.order.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderResponseDto {
    private Long id;
    private String orderReference;
    private String date;
    private LocalDateTime createdAt;
    private List<CustomerOrderItemDto> items;
    private BigDecimal totalAmount;
    private String total; // Formatted e.g. LKR 18,500
    private String currency;
    private String status;
    private String statusCategory; // processing, delivered, returns, cancellations
    private String deliveryAddress;
    private String paymentMethod;
    private String paymentStatus;

    public static CustomerOrderResponseDto fromEntity(Order order) {
        if (order == null) return null;

        String ref = order.getOrderReference() != null && !order.getOrderReference().isEmpty()
                ? order.getOrderReference()
                : "ORD-" + order.getId();

        String formattedDate = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"))
                : "";

        String currencyStr = order.getCurrency() != null ? order.getCurrency() : "LKR";
        BigDecimal amt = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        String formattedTotal = currencyStr + " " + String.format("%,.2f", amt);

        String category = "processing";
        if (order.getStatus() == OrderStatus.COMPLETED) {
            category = "delivered";
        } else if (order.getStatus() == OrderStatus.CANCELLED) {
            category = "cancellations";
        } else if ("RETURNED".equalsIgnoreCase(order.getStatus().name()) || "REFUNDED".equalsIgnoreCase(order.getStatus().name())) {
            category = "returns";
        }

        List<CustomerOrderItemDto> itemDtos = order.getItems() == null
                ? Collections.emptyList()
                : order.getItems().stream()
                        .map(CustomerOrderItemDto::fromEntity)
                        .collect(Collectors.toList());

        String payMethodStr = order.getPaymentMethod() != null ? order.getPaymentMethod().name().replace("_", " ") : "Card";

        return CustomerOrderResponseDto.builder()
                .id(order.getId())
                .orderReference(ref)
                .date(formattedDate)
                .createdAt(order.getCreatedAt())
                .items(itemDtos)
                .totalAmount(amt)
                .total(formattedTotal)
                .currency(currencyStr)
                .status(order.getStatus() != null ? order.getStatus().name() : "PROCESSING")
                .statusCategory(category)
                .deliveryAddress(order.getShippingAddress() != null ? order.getShippingAddress() : "")
                .paymentMethod(payMethodStr)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "")
                .build();
    }
}

