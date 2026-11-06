package com.icrowd_api.features.order;

import lombok.Getter;

@Getter
public class OutOfStockException extends RuntimeException {
    private final Long productId;
    private final String productName;

    public OutOfStockException(Long productId, String productName) {
        super("Product out of stock: " + productName);
        this.productId = productId;
        this.productName = productName;
    }
}
