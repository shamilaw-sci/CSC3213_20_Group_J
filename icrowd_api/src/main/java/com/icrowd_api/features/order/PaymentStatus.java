package com.icrowd_api.features.order;

public enum PaymentStatus {
    PENDING,
    REFUND_PENDING,
    REFUNDED,
    INITIATED,
    SUCCESS,
    FAILED,
    CANCELLED,
    DUE_ON_DELIVERY
}
