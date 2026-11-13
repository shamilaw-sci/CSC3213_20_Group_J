package com.icrowd_api.features.recommendation.dto;

import com.icrowd_api.features.product.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FrequentlyBoughtTogetherResponse {
    private Product targetProduct;
    private List<Product> bundledProducts;
    private BigDecimal regularTotal;
    private BigDecimal bundleTotal;
    private BigDecimal savings;
    private Integer discountPercentage;
    private Boolean isEmpiricalBasket; // true if from real co-occurrence orders, false if complementary fallback
}

