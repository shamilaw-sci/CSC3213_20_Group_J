package com.icrowd_api.features.product;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        String sku,
        String name,
        String description,
        Long categoryId,
        BigDecimal price,
        Integer availableStock,
        List<String> imageUrls,
        List<String> tags,
        Boolean isActive
) {}
