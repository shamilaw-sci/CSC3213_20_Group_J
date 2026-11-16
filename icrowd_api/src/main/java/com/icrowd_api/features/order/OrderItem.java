package com.icrowd_api.features.order;

import com.icrowd_api.features.product.Product;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(
    name = "order_items",
    indexes = {
        @Index(name = "idx_order_items_order_id", columnList = "order_id"),
        @Index(name = "idx_order_items_product_id", columnList = "product_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtTimeOfPurchase;

    @Column(precision = 10, scale = 2)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private BigDecimal costPriceAtTimeOfPurchase;

    @com.fasterxml.jackson.annotation.JsonIgnore
    public BigDecimal getEffectiveCostPrice() {
        if (costPriceAtTimeOfPurchase != null && costPriceAtTimeOfPurchase.compareTo(BigDecimal.ZERO) >= 0) {
            return costPriceAtTimeOfPurchase;
        }
        if (priceAtTimeOfPurchase != null) {
            return priceAtTimeOfPurchase.multiply(new BigDecimal("0.60")).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
