package com.icrowd_api.features.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryDto {

    private OverviewDto overview;
    private List<SalesForecastDto> salesForecast;
    private List<CategoryDistributionDto> inventoryDistribution;
    private List<ProfitAnalysisDto> profitAnalysis;
    private OpportunityInsightsDto opportunityInsights;
    private String aiRecommendation;
    private List<RestockPredictionDto> restockPredictions;
    private InventoryHealthDto inventoryHealth;
    private List<TopProductDto> topProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewDto {
        private BigDecimal totalRevenue;
        private BigDecimal totalProfit;
        private Double profitMargin;
        private Integer totalUnitsSold;
        private BigDecimal inventoryValuation;
        private BigDecimal predictedNextMonthRevenue;
        private Integer lowStockCount;
        private String topCategory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesForecastDto {
        private String name;
        private Integer sales;
        private Integer predicted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDistributionDto {
        private String name;
        private Integer value;
        private Integer percentage;
        private Integer currentStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfitAnalysisDto {
        private String month;
        private BigDecimal revenue;
        private BigDecimal profit;
        private BigDecimal cost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpportunityInsightsDto {
        private String topGrowthArea;
        private String profitOptimization;
        private String restockAlert;
        private String generalSummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestockPredictionDto {
        private String category;
        private Integer currentStock;
        private Integer predictedDemand;
        private Integer predictedUnits;
        private Integer neededUnits;
        private String urgency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryHealthDto {
        private List<LowStockItemDto> lowStockItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockItemDto {
        private String name;
        private String sku;
        private String category;
        private Integer stock;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductDto {
        private String name;
        private String category;
        private Integer unitsSold;
        private BigDecimal revenue;
        private BigDecimal profit;
    }
}
