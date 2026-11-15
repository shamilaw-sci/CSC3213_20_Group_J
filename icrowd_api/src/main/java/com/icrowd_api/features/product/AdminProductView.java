package com.icrowd_api.features.product;
import java.math.BigDecimal;
import java.util.*;
public record AdminProductView(Long id,String sku,String name,String description,CatalogProduct.CategoryView category,
        BigDecimal price,BigDecimal costPrice,Integer leadTimeDays,Integer availableStock,List<String> imageUrls,
        List<String> tags,Boolean isActive,long version,Double averageRating,Integer reviewCount) {
    public static AdminProductView from(Product p) {
        return new AdminProductView(p.getId(),p.getSku(),p.getName(),p.getDescription(),
            p.getCategory()==null?null:new CatalogProduct.CategoryView(p.getCategory().getId(),p.getCategory().getName()),
            p.getPrice(),p.getCostPrice(),p.getLeadTimeDays(),p.getAvailableStock(),
            p.getImageUrls()==null?List.of():List.copyOf(p.getImageUrls()),p.getTags()==null?List.of():List.copyOf(p.getTags()),
            p.getIsActive(),p.getVersion(),p.getAverageRating(),p.getReviewCount());
    }
}
