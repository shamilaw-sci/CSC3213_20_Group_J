package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.DeliveryType;
import com.icrowd_api.features.order.OrderStatus;
import com.icrowd_api.features.order.PaymentMethod;
import com.icrowd_api.features.order.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderSummaryDto {
    private Long id;
    private String orderReference;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private DeliveryType deliveryType;
    private BigDecimal subTotal;
    private BigDecimal discount;
    private BigDecimal shippingCost;
    private BigDecimal totalAmount;
    private String currency;
    private String shippingAddress;
    private String shippingDistrict;
    private Double shippingLat;
    private Double shippingLng;
    private String receiptUrl;
    private int itemCount;
    private List<AdminOrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
