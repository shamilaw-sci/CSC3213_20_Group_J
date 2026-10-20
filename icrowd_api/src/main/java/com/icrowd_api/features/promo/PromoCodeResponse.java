package com.icrowd_api.features.promo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PromoCodeResponse {

    private Long id;
    private String code;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minimumOrderAmount;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private Integer totalUsageLimit;
    private Integer perCustomerLimit;
    private CustomerEligibility customerEligibility;
    private List<String> eligibleCustomerEmails;
    private Boolean active;
    private int usageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Computed status: ACTIVE | DISABLED | EXPIRED | SCHEDULED
     */
    private String status;

    public static PromoCodeResponse from(PromoCode p) {
        String status;
        if (!p.getActive()) {
            status = "DISABLED";
        } else if (p.getExpiryDate() != null && p.getExpiryDate().isBefore(LocalDate.now())) {
            status = "EXPIRED";
        } else if (p.getStartDate() != null && p.getStartDate().isAfter(LocalDate.now())) {
            status = "SCHEDULED";
        } else {
            status = "ACTIVE";
        }
        return PromoCodeResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .maxDiscountAmount(p.getMaxDiscountAmount())
                .minimumOrderAmount(p.getMinimumOrderAmount())
                .startDate(p.getStartDate())
                .expiryDate(p.getExpiryDate())
                .totalUsageLimit(p.getTotalUsageLimit())
                .perCustomerLimit(p.getPerCustomerLimit())
                .customerEligibility(p.getCustomerEligibility())
                .eligibleCustomerEmails(p.getEligibleCustomerEmails())
                .active(p.getActive())
                .usageCount(p.getUsageCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .status(status)
                .build();
    }
}
