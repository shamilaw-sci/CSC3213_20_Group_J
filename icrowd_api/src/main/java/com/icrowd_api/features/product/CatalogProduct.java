package com.icrowd_api.features.product;
import java.math.BigDecimal;
import java.util.*;
import com.fasterxml.jackson.annotation.JsonInclude;
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CatalogProduct(Long id, String sku, String name, String description, CategoryView category,
        BigDecimal price, Integer availableStock, List<String> imageUrls, String brand, Double averageRating,
        Integer reviewCount, Boolean isActive, String warranty, String deliveryInfo, List<String> tags,
        List<String> features, Map<String,String> specifications) {
    public record CategoryView(Long id,String name) {}
    public static CatalogProduct summary(Product p) { return from(p,false); }
    public static CatalogProduct detail(Product p) { return from(p,true); }
    private static CatalogProduct from(Product p,boolean detail) {
        var images=p.getImageUrls()==null?List.<String>of():p.getImageUrls();
        return new CatalogProduct(p.getId(),p.getSku(),p.getName(),p.getDescription(),
            p.getCategory()==null?null:new CategoryView(p.getCategory().getId(),p.getCategory().getName()),
            p.getPrice(),p.getAvailableStock(),List.copyOf(detail?images:images.stream().limit(1).toList()),
            p.getBrand(),p.getAverageRating(),p.getReviewCount(),p.getIsActive(),detail?p.getWarranty():null,
            detail?p.getDeliveryInfo():null,detail&&p.getTags()!=null?List.copyOf(p.getTags()):null,
            detail&&p.getFeatures()!=null?List.copyOf(p.getFeatures()):null,
            detail&&p.getSpecifications()!=null?Map.copyOf(p.getSpecifications()):null);
    }
}
