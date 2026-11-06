package com.icrowd_api.features.promo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoStatsResponse {
    private long activeCodes;
    private long expiredCodes;
    private long totalRedemptions;
    private BigDecimal totalDiscountGiven;
}
