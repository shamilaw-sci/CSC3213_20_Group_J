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
        Boolean isActive,
        BigDecimal costPrice,
        Integer leadTimeDays,
        Long version
) {
    public ProductRequest(String sku,String name,String description,Long categoryId,BigDecimal price,Integer availableStock,
            List<String> imageUrls,List<String> tags,Boolean isActive) {
        this(sku,name,description,categoryId,price,availableStock,imageUrls,tags,isActive,null,null,null);
    }
}
