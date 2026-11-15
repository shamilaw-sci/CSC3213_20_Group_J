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
    private List<SkuRestockDto> skuRestockPredictions;
    private BigDecimal totalRestockBudget;
    private InventoryHealthDto inventoryHealth;
    private List<TopProductDto> topProducts;
    private List<WorstProductDto> worstProducts;
    private List<CategoryPerformanceDto> categoryPerformance;
    private CustomerAnalyticsDto customerAnalytics;
    private ForecastMetricsDto forecastMetrics;
    private String trendGrain; // "daily", "weekly", "monthly"
    private Boolean isDemoData;
    private String dataSource;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewDto {
        private BigDecimal totalRevenue;
        private Boolean costsEstimated;
        private BigDecimal totalCost; // Purchase-time Cost of Goods Sold (COGS)
        private BigDecimal grossProfit;
        private BigDecimal netProfit;
        private BigDecimal totalProfit; // Maintained for backward compatibility
        private Double profitMargin;
        private Integer totalUnitsSold;
        private Integer qualifyingOrderCount;
        private BigDecimal inventoryValuation;
        private BigDecimal predictedNextMonthRevenue;
        private Integer lowStockCount;
        private String topCategory;
        private String selectedRange;
        private String dateRangeLabel;
        private Boolean isDemoData;
        private String dataSource;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesForecastDto {
        private String name;
        private Integer sales;
        private Integer predicted;
        private Integer lowerBound;
        private Integer upperBound;
        private Boolean isHistorical;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastMetricsDto {
        private String modelName;
        private Double mae;
        private Double wape;
        private Double forecastBias;
        private String forecastDate;
        private String dataSufficiency;
        private String validationMethod;
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
        private String dataSource;
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
        private Integer leadTimeDays;
        private Double dailyRunRate;
        private Integer safetyStock;
        private Integer reorderPoint;
        private String dataSufficiency; // "SUFFICIENT", "LIMITED", "INSUFFICIENT_DATA"
        private Integer confidenceLower;
        private Integer confidenceUpper;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkuRestockDto {
        private String sku;
        private String name;
        private String category;
        private Integer currentStock;
        private Integer leadTimeDays;
        private Integer safetyStock;
        private Integer reorderPoint;
        private Integer neededUnits;
        private BigDecimal unitCost;
        private BigDecimal totalRestockCost;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorstProductDto {
        private Long id;
        private String sku;
        private String name;
        private String category;
        private Integer stock;
        private Integer unitsSold;
        private BigDecimal revenue;
        private BigDecimal tiedUpCapital;
        private String status; // "Dead Stock" (0 sold), "Slow Moving" (<= 1 sold)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryPerformanceDto {
        private String category;
        private BigDecimal revenue;
        private Integer unitsSold;
        private BigDecimal costOfGoods;
        private BigDecimal grossProfit;
        private Double grossMargin;
        private Integer activeProductsCount;
        private Integer totalStock;
        private BigDecimal inventoryValuation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerAnalyticsDto {
        private Integer totalCustomers;
        private Integer repeatCustomerCount;
        private Double repeatPurchaseRate;
        private BigDecimal averageOrderValue;
        private BigDecimal customerLifetimeValue;
        private List<TopCustomerDto> topCustomers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCustomerDto {
        private String name;
        private String email;
        private Integer orderCount;
        private BigDecimal totalSpent;
        private String lastOrderDate;
    }
}
