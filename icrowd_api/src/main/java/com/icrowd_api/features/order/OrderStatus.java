package com.icrowd_api.features.order;

public enum OrderStatus {
    PENDING_PAYMENT,
    STOCK_UNAVAILABLE,
    CONFIRMED,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED
}
