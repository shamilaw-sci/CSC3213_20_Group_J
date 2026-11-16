package com.icrowd_api.features.order;

public enum PaymentStatus {
    PENDING,
    INITIATED,
    SUCCESS,
    PAID,
    DUE_ON_DELIVERY,
    FAILED,
    CANCELLED,
    REFUND_PENDING,
    REFUNDED,
    CHARGEBACK,
    REVIEW_REQUIRED
}
