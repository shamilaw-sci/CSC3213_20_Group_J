package com.icrowd_api.features.product;

import com.icrowd_api.features.category.Category;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Check;

@Entity
@Table(name = "products")
@SuppressWarnings("deprecation")
@Check(constraints = "available_stock >= 0")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Version
    @org.hibernate.annotations.ColumnDefault("0")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private long version;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @PositiveOrZero
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @PositiveOrZero
    @Column(precision = 10, scale = 2)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private BigDecimal costPrice;

    @PositiveOrZero
    @Column(nullable = false)
    private Integer availableStock;

    @Builder.Default
    @Column(nullable = false)
    @org.hibernate.annotations.ColumnDefault("7")
    private Integer leadTimeDays = 7;

    @ElementCollection
    @CollectionTable(name = "product_image_urls", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    @Size(max = 5)
    private List<String> imageUrls;

    @ElementCollection
    @CollectionTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag")
    @Size(max = 10)
    private List<String> tags;

    private String brand;
    private String warranty;
    private String deliveryInfo;

    @ElementCollection
    @CollectionTable(name = "product_features", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "feature")
    private List<String> features;

    @ElementCollection
    @CollectionTable(name = "product_specifications", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "spec_key")
    @Column(name = "spec_value")
    private java.util.Map<String, String> specifications;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    private Double averageRating = 0.0;

    @Builder.Default
    private Integer reviewCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    public BigDecimal getEffectiveCostPrice() {
        if (costPrice != null && costPrice.compareTo(BigDecimal.ZERO) >= 0) {
            return costPrice;
        }
        if (price != null) {
            return price.multiply(new BigDecimal("0.60")).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
