package com.icrowd_api.features.order;

public enum OrderStatus {
    PENDING,
    PENDING_PAYMENT,
    STOCK_UNAVAILABLE,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED,
    CHARGEBACK,
    REVIEW_REQUIRED
}
