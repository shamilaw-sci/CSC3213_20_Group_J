package com.icrowd_api.features.analytics;

import com.icrowd_api.features.analytics.dto.AnalyticsSummaryDto;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import com.icrowd_api.features.order.Order;
import com.icrowd_api.features.order.OrderItem;
import com.icrowd_api.features.order.OrderRepository;
import com.icrowd_api.features.order.OrderStatus;
import com.icrowd_api.features.order.PaymentStatus;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AnalyticsFacts factsRepository;

    // Cache with short TTL (30 seconds) to avoid redundant DB aggregations on rapid UI clicks
    private final Map<String, CacheEntry> cache = new LinkedHashMap<>();
    private static final long CACHE_TTL_MS = 30_000;

    private record CacheEntry(AnalyticsSummaryDto data, long timestamp) {}

    /**
     * Qualifying order statuses that legitimately represent finalized or active sales.
     * Failed, cancelled, stock unavailable, and unconfirmed orders are strictly excluded.
     */
    public static final Set<OrderStatus> QUALIFYING_ORDER_STATUSES = Collections.unmodifiableSet(EnumSet.of(
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
    ));

    /**
     * Qualifying payment statuses that legitimately represent confirmed or collected funds.
     */
    public static final Set<PaymentStatus> QUALIFYING_PAYMENT_STATUSES = Collections.unmodifiableSet(EnumSet.of(
            PaymentStatus.PAID,
            PaymentStatus.SUCCESS,
            PaymentStatus.DUE_ON_DELIVERY
    ));

    public AnalyticsSummaryDto getAnalyticsSummary() {
        return getAnalyticsSummary("all", null, null, false);
    }

    public AnalyticsSummaryDto getAnalyticsSummary(String range, LocalDate startDate, LocalDate endDate) {
        return getAnalyticsSummary(range, startDate, endDate, false);
    }

    public AnalyticsSummaryDto getAnalyticsSummary(String range, LocalDate startDate, LocalDate endDate, boolean demo) {
        return getAnalyticsSummary(range, startDate, endDate, demo, "monthly");
    }

    public synchronized AnalyticsSummaryDto getAnalyticsSummary(String range, LocalDate startDate, LocalDate endDate, boolean demo, String grain) {
        String appliedGrain = (grain != null && !grain.isBlank()) ? grain.toLowerCase().trim() : "monthly";
        range = range==null ? "all" : range.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("all","today","7d","30d","90d","this_month","last_month","custom").contains(range)) throw new IllegalArgumentException("Unknown date range");
        if (!Set.of("daily","weekly","monthly").contains(appliedGrain)) throw new IllegalArgumentException("Unknown chart interval");
        if (startDate!=null || endDate!=null) range="custom";
        if (startDate!=null && endDate!=null && ChronoUnit.DAYS.between(startDate,endDate)>3660) throw new IllegalArgumentException("Choose a range of at most ten years");
        cache.entrySet().removeIf(e -> System.currentTimeMillis()-e.getValue().timestamp() >= CACHE_TTL_MS);
        // Cache lookup key
        String cacheKey = String.format("%s_%s_%s_%b_%s", range, startDate, endDate, demo, appliedGrain);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && (System.currentTimeMillis() - cached.timestamp()) < CACHE_TTL_MS) {
            return cached.data();
        }

        AnalyticsSummaryDto summary = computeAnalyticsSummary(range, startDate, endDate, demo, appliedGrain);
        if (cache.size() >= 64) cache.remove(cache.keySet().iterator().next());
        cache.put(cacheKey, new CacheEntry(summary, System.currentTimeMillis()));
        return summary;
    }

    private AnalyticsSummaryDto computeAnalyticsSummary(String range, LocalDate startDate, LocalDate endDate, boolean demo, String grain) {
        // ── 1. Date Range Boundaries & Validation ──────────────────────────────────────
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = now;
        String appliedRange = range != null ? range.toLowerCase().trim() : "all";
        String dateRangeLabel;

        if (startDate != null || endDate != null || "custom".equalsIgnoreCase(appliedRange)) {
            if (startDate == null || endDate == null) {
                throw new IllegalArgumentException("Both startDate and endDate must be provided for a custom date range.");
            }
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Start date (" + startDate + ") cannot be after end date (" + endDate + ").");
            }
            if (endDate.isAfter(LocalDate.now().plusDays(1))) {
                throw new IllegalArgumentException("End date (" + endDate + ") cannot be in the future.");
            }

            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(23, 59, 59, 999_999_999);
            appliedRange = "custom";
            dateRangeLabel = startDate.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) + " - " +
                    endDate.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
        } else {
            switch (appliedRange) {
                case "today":
                    startDateTime = LocalDate.now().atStartOfDay();
                    endDateTime = now;
                    dateRangeLabel = "Today (" + LocalDate.now().format(DateTimeFormatter.ofPattern("MMM dd")) + ")";
                    break;
                case "7d":
                    startDateTime = LocalDate.now().minusDays(6).atStartOfDay();
                    endDateTime = now;
                    dateRangeLabel = "Last 7 Days";
                    break;
                case "30d":
                    startDateTime = LocalDate.now().minusDays(29).atStartOfDay();
                    endDateTime = now;
                    dateRangeLabel = "Last 30 Days";
                    break;
                case "90d":
                    startDateTime = LocalDate.now().minusDays(89).atStartOfDay();
                    endDateTime = now;
                    dateRangeLabel = "Last 90 Days";
                    break;
                case "this_month":
                    startDateTime = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                    endDateTime = now;
                    dateRangeLabel = "This Month (" + LocalDate.now().getMonth().name() + ")";
                    break;
                case "last_month":
                    LocalDate lastMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1);
                    startDateTime = lastMonthStart.atStartOfDay();
                    endDateTime = lastMonthStart.plusMonths(1).minusDays(1).atTime(23, 59, 59, 999_999_999);
                    dateRangeLabel = "Last Month (" + lastMonthStart.getMonth().name() + ")";
                    break;
                case "all":
                default:
                    appliedRange = "all";
                    startDateTime = null;
                    endDateTime = now;
                    dateRangeLabel = "All Time";
                    break;
            }
        }

        // ── 2. Database Aggregations ─────────────────────────────────────────────────
        List<Product> products = productRepository.findAllActiveProductsList();
        List<Category> categories = categoryRepository.findAll();

        // All-time totals cover all orders; chart/forecast samples use the latest two years.
        LocalDateTime chartStart = startDateTime==null ? now.minusYears(2).withDayOfMonth(1).toLocalDate().atStartOfDay() : startDateTime;
        var facts = factsRepository.read(startDateTime,endDateTime,chartStart,"today".equals(appliedRange));
        int qualifyingOrderCount = facts.orderCount();

        // ── 3. Live Inventory Metrics ────────────────────────────────────────────────
        BigDecimal inventoryValuation = BigDecimal.ZERO;
        int lowStockCount = 0;
        List<AnalyticsSummaryDto.LowStockItemDto> lowStockItems = new ArrayList<>();
        Map<String, Integer> categoryStockMap = new HashMap<>();

        for (Product p : products) {
            int stock = p.getAvailableStock() != null ? p.getAvailableStock() : 0;
            BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            inventoryValuation = inventoryValuation.add(price.multiply(BigDecimal.valueOf(stock)));

            String catName = p.getCategory() != null ? p.getCategory().getName() : "General";
            categoryStockMap.put(catName, categoryStockMap.getOrDefault(catName, 0) + stock);

            if (stock <= 20) {
                lowStockCount++;
                String status = stock == 0 ? "Out of Stock" : (stock <= 5 ? "Critical" : "Low Stock");
                lowStockItems.add(AnalyticsSummaryDto.LowStockItemDto.builder()
                        .name(p.getName())
                        .sku(p.getSku())
                        .category(catName)
                        .stock(stock)
                        .status(status)
                        .build());
            }
        }
        lowStockItems.sort(Comparator.comparingInt(AnalyticsSummaryDto.LowStockItemDto::getStock));

        // ── 4. Process Qualifying Orders (Actual Calculations) ────────────────────────
        int totalUnitsSold = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO; // Cost of Goods Sold (purchase-time cost)
        BigDecimal totalDiscounts = facts.discounts();

        Map<String, Integer> categoryUnitsSold = new HashMap<>();
        Map<String, BigDecimal> categoryRevenueMap = new HashMap<>();
        Map<String, BigDecimal> categoryCostMap = new HashMap<>();

        Map<Long, Integer> productUnitsSold = new HashMap<>();
        Map<Long, BigDecimal> productRevenueMap = new HashMap<>();
        Map<Long, BigDecimal> productCostMap = new HashMap<>();

        // Daily sales records for historical time series and forecasting
        Map<LocalDate, Integer> dailyUnitsSold = new TreeMap<>();
        Map<LocalDate, BigDecimal> dailyRevenueMap = new TreeMap<>();
        Map<LocalDate, BigDecimal> dailyCostMap = new TreeMap<>();
        Map<String, Map<LocalDate, Integer>> categoryDailyUnits = new HashMap<>();

        for (var row : facts.products()) {
            totalUnitsSold += row.units(); totalRevenue=totalRevenue.add(row.revenue()); totalCost=totalCost.add(row.cost());
            categoryUnitsSold.merge(row.category(),row.units(),Integer::sum);
            categoryRevenueMap.merge(row.category(),row.revenue(),BigDecimal::add);
            categoryCostMap.merge(row.category(),row.cost(),BigDecimal::add);
            productUnitsSold.put(row.id(),row.units()); productRevenueMap.put(row.id(),row.revenue()); productCostMap.put(row.id(),row.cost());
        }
        for (var row : facts.periods()) {
            LocalDate date=row.time().toLocalDate();
            dailyUnitsSold.merge(date,row.units(),Integer::sum); dailyRevenueMap.merge(date,row.revenue(),BigDecimal::add); dailyCostMap.merge(date,row.cost(),BigDecimal::add);
            categoryDailyUnits.computeIfAbsent(row.category(),key -> new TreeMap<>()).merge(date,row.units(),Integer::sum);
        }
        for (LocalDate date=chartStart.toLocalDate(); !date.isAfter(endDateTime.toLocalDate()); date=date.plusDays(1)) dailyUnitsSold.putIfAbsent(date,0);
        boolean estimatedCosts=facts.products().stream().anyMatch(row -> row.estimatedUnits()>0) || products.stream().anyMatch(p -> p.getCostPrice()==null);

        // ── 5. Demo Mode Handling ────────────────────────────────────────────────────
        // Only if demo mode is explicitly requested, generate simulated realistic demo figures.
        // In standard mode, show actual zero / low figures without faking data!
        boolean isDemoActive = demo;
        String dataSourceDescription;

        if (isDemoActive) {
            double timeScale = getTimeScale(appliedRange, startDate, endDate);
            totalUnitsSold = (int) Math.max(15, Math.round(1480 * timeScale));
            totalRevenue = BigDecimal.valueOf(248500.00 * timeScale).setScale(2, RoundingMode.HALF_UP);
            totalCost = BigDecimal.valueOf(149100.00 * timeScale).setScale(2, RoundingMode.HALF_UP);

            categoryUnitsSold.put("Headset", (int) Math.max(6, Math.round(620 * timeScale)));
            categoryUnitsSold.put("PowerBank", (int) Math.max(5, Math.round(480 * timeScale)));
            categoryUnitsSold.put("Case", (int) Math.max(4, Math.round(380 * timeScale)));

            dataSourceDescription = "DEMO MODE - Simulated Sample Data (Not Production Database)";
        } else {
            dataSourceDescription = String.format("Live Production Database (%d qualifying orders analyzed)", qualifyingOrderCount)
                + (estimatedCosts ? ". Cost/profit estimates include missing costs assumed at 60% of purchase price; enter verified purchase costs." : ". Costs use recorded purchase prices.")
                + (startDateTime==null ? " All-time totals; charts and validation show the latest two years." : "");
        }

        // ── 6. Documented Gross & Net Profit Measures ────────────────────────────────
        // Gross Profit = Revenue - Cost of Goods Sold (purchase-time cost)
        // Net Profit = Gross Profit - Order Discounts
        // Profit Margin = (Gross Profit / Revenue) * 100
        BigDecimal grossProfit = totalRevenue.subtract(totalCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netProfit = grossProfit.subtract(totalDiscounts).setScale(2, RoundingMode.HALF_UP);
        if (netProfit.compareTo(BigDecimal.ZERO) < 0 && totalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            netProfit = BigDecimal.ZERO;
        }

        double profitMargin = 0.0;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMargin = grossProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        // Top Selling Category
        String topCategory = categoryUnitsSold.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(categories.isEmpty() ? "None" : categories.get(0).getName());

        // ── 7. Prediction & Forecasting Baseline (Steps 1-6) ─────────────────────────
        long horizonDays=Math.max(1,ChronoUnit.DAYS.between(startDateTime==null ? facts.firstSale() : startDateTime.toLocalDate(),endDateTime.toLocalDate())+1);
        double dailyRunRate=(double)totalUnitsSold/horizonDays;
        BigDecimal predictedNextMonthRevenue=totalUnitsSold==0 ? BigDecimal.ZERO : BigDecimal.valueOf(dailyRunRate*30*totalRevenue.doubleValue()/totalUnitsSold).setScale(2,RoundingMode.HALF_UP);
        var buckets = chartBuckets(chartStart,endDateTime,appliedRange,grain,facts.periods());
        List<AnalyticsSummaryDto.SalesForecastDto> salesForecast = isDemoActive ? generateDemoSalesForecast(appliedRange) : buckets.stream().map(b -> AnalyticsSummaryDto.SalesForecastDto.builder().name(b.label()).sales(b.units()).predicted(null).isHistorical(true).build()).collect(Collectors.toCollection(ArrayList::new));
        if (!isDemoActive && !buckets.isEmpty()) {
            int prediction=(int)Math.round(buckets.stream().skip(Math.max(0,buckets.size()-7)).mapToInt(Bucket::units).average().orElse(0));
            salesForecast.add(AnalyticsSummaryDto.SalesForecastDto.builder().name("Next interval (estimate)").sales(null).predicted(prediction).isHistorical(false).build());
        }
        var forecastMetrics=evaluateForecastAccuracy(dailyUnitsSold,isDemoActive);
        List<AnalyticsSummaryDto.ProfitAnalysisDto> profitAnalysis=isDemoActive ? generateDemoProfitAnalysis(appliedRange,totalRevenue,totalCost) : buckets.stream().map(b -> AnalyticsSummaryDto.ProfitAnalysisDto.builder().month(b.label()).revenue(b.revenue()).cost(b.cost()).profit(b.revenue().subtract(b.cost())).build()).toList();

        // Category Distribution Chart
        int sumCategoryUnits = categoryUnitsSold.values().stream().mapToInt(v -> v != null ? v : 0).sum();
        final int finalSumUnits = sumCategoryUnits > 0 ? sumCategoryUnits : 1;

        List<AnalyticsSummaryDto.CategoryDistributionDto> inventoryDistribution = new ArrayList<>();
        categoryUnitsSold.forEach((catName, units) -> {
            int currentStock = categoryStockMap.getOrDefault(catName, 0);
            int percentage = (int) Math.round(((double) units / finalSumUnits) * 100);
            inventoryDistribution.add(AnalyticsSummaryDto.CategoryDistributionDto.builder()
                    .name(catName)
                    .value(units)
                    .percentage(percentage)
                    .currentStock(currentStock)
                    .build());
        });

        // ── 8. Replenishment & Restock Prediction (Step 6) ───────────────────────────
        // Uses lead-time demand, statistical safety stock, available inventory
        List<AnalyticsSummaryDto.RestockPredictionDto> restockPredictions = new ArrayList<>();
        for (Category cat : categories) {
            String catName = cat.getName();
            int currentStock = categoryStockMap.getOrDefault(catName, 0);
            int unitsSold = categoryUnitsSold.getOrDefault(catName, 0);

            int catLeadTime = 7; // Average supplier lead time in days
            double catDailyDemand = horizonDays > 0 ? (double) unitsSold / horizonDays : 0.0;

            // Daily demand standard deviation
            Map<LocalDate, Integer> catDaily = categoryDailyUnits.getOrDefault(catName, Collections.emptyMap());
            double stdDev = calculateStdDev(catDaily.values(), catDailyDemand);

            // Safety Stock: z * sqrt(L) * stdDev with z=1.65 (95% service level)
            int safetyStock = (int) Math.ceil(1.65 * Math.sqrt(catLeadTime) * Math.max(0.5, stdDev));
            int expectedLeadTimeDemand = (int) Math.ceil(catDailyDemand * catLeadTime);
            int reorderPoint = expectedLeadTimeDemand + safetyStock;

            // Monthly run rate
            int monthlyDemand = (int) Math.ceil(catDailyDemand * 30);
            int neededUnits = Math.max(0, reorderPoint - currentStock);

            // Data sufficiency check
            String sufficiency;
            String notes;
            if (isDemoActive) {
                sufficiency = "SUFFICIENT";
                notes = "Calibrated from simulated baseline.";
            } else if (unitsSold < 5) {
                sufficiency = "INSUFFICIENT_DATA";
                notes = "Insufficient historical orders. Showing baseline safety inventory thresholds.";
            } else if (unitsSold < 20) {
                sufficiency = "LIMITED";
                notes = "Limited sample size. Forecast uncertainty elevated.";
            } else {
                sufficiency = "SUFFICIENT";
                notes = "Empirical moving average with 95% service level safety stock.";
            }

            // Confidence interval for next month demand: +/- 1.96 * sqrt(30) * stdDev
            int ciMargin = (int) Math.ceil(1.96 * Math.sqrt(30) * Math.max(0.5, stdDev));
            int confLower = Math.max(0, monthlyDemand - ciMargin);
            int confUpper = monthlyDemand + ciMargin;

            String urgency;
            if (currentStock == 0) {
                urgency = "Stockout / Critical";
            } else if (currentStock <= expectedLeadTimeDemand) {
                urgency = "High";
            } else if (currentStock <= reorderPoint) {
                urgency = "Moderate";
            } else {
                urgency = "Adequate";
            }

            restockPredictions.add(AnalyticsSummaryDto.RestockPredictionDto.builder()
                    .category(catName)
                    .currentStock(currentStock)
                    .predictedDemand(monthlyDemand)
                    .predictedUnits(monthlyDemand)
                    .neededUnits(neededUnits)
                    .urgency(urgency)
                    .leadTimeDays(catLeadTime)
                    .dailyRunRate(Math.round(catDailyDemand * 100.0) / 100.0)
                    .safetyStock(safetyStock)
                    .reorderPoint(reorderPoint)
                    .dataSufficiency(sufficiency)
                    .confidenceLower(confLower)
                    .confidenceUpper(confUpper)
                    .notes(notes)
                    .build());
        }

        // ── 9. Strategic Opportunity Insights (Generated from Real Data) ──────────────
        AnalyticsSummaryDto.OpportunityInsightsDto opportunityInsights = generateOpportunityInsights(
                dateRangeLabel, topCategory, categoryRevenueMap, categoryCostMap, lowStockCount,
                qualifyingOrderCount, totalUnitsSold, grossProfit, profitMargin, dataSourceDescription
        );

        String aiRecommendation = String.format(
                "Prioritize %s inventory management with 95%% service level buffer; gross profit margin stands at %.1f%% across active lines.",
                topCategory, profitMargin
        );

        // ── 10. Top Performing Products ──────────────────────────────────────────────
        List<AnalyticsSummaryDto.TopProductDto> topProducts = products.stream()
                .filter(p -> productUnitsSold.containsKey(p.getId()))
                .sorted((p1, p2) -> productUnitsSold.get(p2.getId()).compareTo(productUnitsSold.get(p1.getId())))
                .limit(10)
                .map(p -> {
                    int qty = productUnitsSold.get(p.getId());
                    BigDecimal rev = productRevenueMap.getOrDefault(p.getId(), BigDecimal.ZERO);
                    BigDecimal cost = productCostMap.getOrDefault(p.getId(), p.getEffectiveCostPrice().multiply(BigDecimal.valueOf(qty)));
                    BigDecimal profit = rev.subtract(cost).setScale(2, RoundingMode.HALF_UP);
                    return AnalyticsSummaryDto.TopProductDto.builder()
                            .name(p.getName())
                            .category(p.getCategory() != null ? p.getCategory().getName() : "General")
                            .unitsSold(qty)
                            .revenue(rev)
                            .profit(profit)
                            .build();
                })
                .collect(Collectors.toList());

        // ── 11. Customer Purchase Analytics (RFM / CLV / AOV) ────────────────────────
        AnalyticsSummaryDto.CustomerAnalyticsDto customerAnalytics = facts.customers();

        // ── 12. Worst Performing & Dead Stock SKUs ───────────────────────────────────
        List<AnalyticsSummaryDto.WorstProductDto> worstProducts = calculateWorstProducts(products, productUnitsSold, productRevenueMap);

        // ── 13. Category Performance Matrix ──────────────────────────────────────────
        List<AnalyticsSummaryDto.CategoryPerformanceDto> categoryPerformance = calculateCategoryPerformance(
                categories, products, categoryRevenueMap, categoryUnitsSold, categoryCostMap, categoryStockMap
        );

        // ── 14. SKU-Level Restock & Capital Budget ───────────────────────────────────
        List<AnalyticsSummaryDto.SkuRestockDto> skuRestockPredictions = new ArrayList<>();
        BigDecimal totalRestockBudget = calculateSkuRestocks(products, productUnitsSold, horizonDays, skuRestockPredictions);

        // Overview DTO
        AnalyticsSummaryDto.OverviewDto overview = AnalyticsSummaryDto.OverviewDto.builder()
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .costsEstimated(estimatedCosts)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .totalProfit(grossProfit)
                .profitMargin(Math.round(profitMargin * 10.0) / 10.0)
                .totalUnitsSold(totalUnitsSold)
                .qualifyingOrderCount(qualifyingOrderCount)
                .inventoryValuation(inventoryValuation.setScale(2, RoundingMode.HALF_UP))
                .predictedNextMonthRevenue(predictedNextMonthRevenue)
                .lowStockCount(lowStockCount)
                .topCategory(topCategory)
                .selectedRange(appliedRange)
                .dateRangeLabel(dateRangeLabel)
                .isDemoData(isDemoActive)
                .dataSource(dataSourceDescription)
                .build();

        return AnalyticsSummaryDto.builder()
                .overview(overview)
                .salesForecast(salesForecast)
                .inventoryDistribution(inventoryDistribution)
                .profitAnalysis(profitAnalysis)
                .opportunityInsights(opportunityInsights)
                .aiRecommendation(aiRecommendation)
                .restockPredictions(restockPredictions)
                .skuRestockPredictions(skuRestockPredictions)
                .totalRestockBudget(totalRestockBudget)
                .inventoryHealth(AnalyticsSummaryDto.InventoryHealthDto.builder().lowStockItems(lowStockItems).build())
                .topProducts(topProducts)
                .worstProducts(worstProducts)
                .categoryPerformance(categoryPerformance)
                .customerAnalytics(customerAnalytics)
                .forecastMetrics(forecastMetrics)
                .trendGrain(grain)
                .isDemoData(isDemoActive)
                .dataSource(dataSourceDescription)
                .build();
    }

    private double getTimeScale(String range, LocalDate startDate, LocalDate endDate) {
        return switch (range) {
            case "today" -> 1.0 / 180.0;
            case "7d" -> 7.0 / 180.0;
            case "30d", "this_month", "last_month" -> 30.0 / 180.0;
            case "90d" -> 90.0 / 180.0;
            case "custom" -> {
                long days = (startDate != null && endDate != null)
                        ? Math.max(1, ChronoUnit.DAYS.between(startDate, endDate) + 1)
                        : 30;
                yield Math.min(1.0, Math.max(0.01, days / 180.0));
            }
            default -> 1.0;
        };
    }

    private double calculateStdDev(Collection<Integer> values, double mean) {
        if (values == null || values.size() <= 1) return Math.max(0.5, mean * 0.2);
        double sumSq = 0.0;
        for (int v : values) {
            sumSq += Math.pow(v - mean, 2);
        }
        return Math.sqrt(sumSq / (values.size() - 1));
    }

    /**
     * Evaluates holdout forecast accuracy (MAE, WAPE, and Forecast Bias) on historical daily sales.
     */
    private AnalyticsSummaryDto.ForecastMetricsDto evaluateForecastAccuracy(Map<LocalDate, Integer> dailyUnits, boolean isDemo) {
        if (isDemo && dailyUnits.size() < 14) {
            return AnalyticsSummaryDto.ForecastMetricsDto.builder()
                    .modelName("Training-mean baseline")
                    .mae(1.25)
                    .wape(8.5)
                    .forecastBias(1.1)
                    .forecastDate(LocalDate.now().toString())
                    .dataSufficiency("SUFFICIENT")
                    .validationMethod("Illustrative sample metrics; not measured accuracy")
                    .build();
        }

        if (dailyUnits.size() >= 14 && dailyUnits.values().stream().anyMatch(units -> units > 0)) {
            // Split into train (first 70%) and test (last 30%)
            List<Map.Entry<LocalDate, Integer>> entries = new ArrayList<>(dailyUnits.entrySet());
            int splitIdx = (int) Math.floor(entries.size() * 0.7);
            if (splitIdx < 1) splitIdx = 1;

            double trainMean = entries.subList(0, splitIdx).stream()
                    .mapToInt(Map.Entry::getValue)
                    .average()
                    .orElse(0.0);

            double sumAbsError = 0.0;
            double sumActual = 0.0;
            double sumError = 0.0;
            int testCount = 0;

            for (int i = splitIdx; i < entries.size(); i++) {
                int actual = entries.get(i).getValue();
                double predicted = trainMean;
                sumAbsError += Math.abs(actual - predicted);
                sumActual += actual;
                sumError += (predicted - actual);
                testCount++;
            }

            Double mae = testCount > 0 ? Math.round((sumAbsError / testCount) * 100.0) / 100.0 : null;
            Double wape = sumActual > 0 ? Math.round((sumAbsError / sumActual) * 1000.0) / 10.0 : null;
            Double bias = sumActual > 0 ? Math.round((sumError / sumActual) * 1000.0) / 10.0 : null;

            return AnalyticsSummaryDto.ForecastMetricsDto.builder()
                    .modelName("Training-mean baseline")
                    .mae(mae)
                    .wape(wape)
                    .forecastBias(bias)
                    .forecastDate(LocalDate.now().toString())
                    .dataSufficiency(sumActual > 0 ? "SUFFICIENT" : "INSUFFICIENT_DATA")
                    .validationMethod("Held-out 30% historical window; percentage metrics require holdout sales")
                    .build();
        }

        return AnalyticsSummaryDto.ForecastMetricsDto.builder()
                .modelName("Training-mean baseline")
                .mae(null)
                .wape(null)
                .forecastBias(null)
                .forecastDate(LocalDate.now().toString())
                .dataSufficiency("INSUFFICIENT_DATA")
                .validationMethod("Requires minimum 14 daily data points for holdout validation")
                .build();
    }

    private record Bucket(String label,int units,BigDecimal revenue,BigDecimal cost) {}
    private List<Bucket> chartBuckets(LocalDateTime start, LocalDateTime end, String range, String grain, List<AnalyticsFacts.PeriodSales> rows) {
        java.util.function.Function<LocalDateTime,LocalDateTime> key = t -> {
            if ("today".equals(range)) return t.withMinute(0).withSecond(0).withNano(0);
            LocalDate d=t.toLocalDate();
            if ("weekly".equals(grain)) d=d.minusDays(d.getDayOfWeek().getValue()-1);
            if ("monthly".equals(grain)) d=d.withDayOfMonth(1);
            return d.atStartOfDay();
        };
        Map<LocalDateTime,Bucket> result=new TreeMap<>();
        java.util.function.UnaryOperator<LocalDateTime> next=t -> "today".equals(range) ? t.plusHours(1) : "daily".equals(grain) ? t.plusDays(1) : "weekly".equals(grain) ? t.plusWeeks(1) : t.plusMonths(1);
        DateTimeFormatter format=DateTimeFormatter.ofPattern("today".equals(range) ? "HH:mm" : "monthly".equals(grain) ? "MMM yyyy" : "dd MMM yyyy");
        for (LocalDateTime t=key.apply(start);!t.isAfter(end);t=next.apply(t)) result.put(t,new Bucket(t.format(format),0,BigDecimal.ZERO,BigDecimal.ZERO));
        for (var row : rows) {
            var t=key.apply(row.time()); var previous=result.get(t);
            if (previous!=null) result.put(t,new Bucket(previous.label(),previous.units()+row.units(),previous.revenue().add(row.revenue()),previous.cost().add(row.cost())));
        }
        return new ArrayList<>(result.values());
    }

    private AnalyticsSummaryDto.OpportunityInsightsDto generateOpportunityInsights(
            String dateRangeLabel, String topCategory, Map<String, BigDecimal> categoryRev,
            Map<String, BigDecimal> categoryCost, int lowStockCount, int qualifyingOrderCount,
            int totalUnitsSold, BigDecimal grossProfit, double profitMargin, String dataSource) {

        // Find highest margin category
        String bestMarginCat = topCategory;
        double highestMargin = 0.0;
        for (Map.Entry<String, BigDecimal> e : categoryRev.entrySet()) {
            BigDecimal rev = e.getValue();
            BigDecimal cost = categoryCost.getOrDefault(e.getKey(), BigDecimal.ZERO);
            if (rev.compareTo(BigDecimal.ZERO) > 0) {
                double m = rev.subtract(cost).divide(rev, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                if (m > highestMargin) {
                    highestMargin = m;
                    bestMarginCat = e.getKey();
                }
            }
        }

        String topGrowthText = totalUnitsSold > 0
                ? String.format("%s is currently the leading volume driver with active conversions across %s.", topCategory, dateRangeLabel)
                : "No customer purchase transactions recorded in this period yet.";

        String profitText = highestMargin > 0
                ? String.format("%s delivers the highest gross margin at %.1f%%; consider feature placement and bundle promotion.", bestMarginCat, highestMargin)
                : "Gross margin benchmarks will dynamically calibrate as qualifying orders are fulfilled.";

        String restockText = lowStockCount > 0
                ? String.format("Warehouse has %d SKU(s) below safety stock thresholds. Immediate supplier replenishment suggested.", lowStockCount)
                : "All product line inventory levels are currently within safe operating buffers.";

        String summaryText = String.format(
                "Processed %d qualifying orders across %s. Gross profit: Rs %s (%.1f%% margin).",
                qualifyingOrderCount, dateRangeLabel, grossProfit.toPlainString(), profitMargin
        );

        return AnalyticsSummaryDto.OpportunityInsightsDto.builder()
                .topGrowthArea(topGrowthText)
                .profitOptimization(profitText)
                .restockAlert(restockText)
                .generalSummary(summaryText)
                .dataSource(dataSource)
                .build();
    }

    private List<AnalyticsSummaryDto.SalesForecastDto> generateDemoSalesForecast(String range) {
        if ("today".equals(range)) {
            return List.of(
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("08:00").sales(5).predicted(6).lowerBound(4).upperBound(8).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("11:00").sales(12).predicted(10).lowerBound(8).upperBound(14).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("14:00").sales(18).predicted(15).lowerBound(12).upperBound(20).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("17:00").sales(24).predicted(22).lowerBound(18).upperBound(26).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("20:00").sales(16).predicted(18).lowerBound(14).upperBound(21).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("23:00").sales(8).predicted(9).lowerBound(6).upperBound(12).isHistorical(true).build()
            );
        } else if ("7d".equals(range)) {
            return List.of(
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Mon").sales(35).predicted(32).lowerBound(28).upperBound(36).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Tue").sales(42).predicted(40).lowerBound(35).upperBound(45).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Wed").sales(38).predicted(45).lowerBound(32).upperBound(48).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Thu").sales(50).predicted(48).lowerBound(42).upperBound(54).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Fri").sales(65).predicted(60).lowerBound(55).upperBound(70).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Sat").sales(78).predicted(75).lowerBound(68).upperBound(85).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Sun").sales(55).predicted(58).lowerBound(48).upperBound(65).isHistorical(true).build()
            );
        } else if ("30d".equals(range) || "this_month".equals(range) || "last_month".equals(range)) {
            return List.of(
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Week 1").sales(68).predicted(70).lowerBound(60).upperBound(78).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Week 2").sales(82).predicted(80).lowerBound(72).upperBound(90).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Week 3").sales(95).predicted(90).lowerBound(82).upperBound(102).isHistorical(true).build(),
                    AnalyticsSummaryDto.SalesForecastDto.builder().name("Week 4").sales(110).predicted(105).lowerBound(95).upperBound(120).isHistorical(true).build()
            );
        }

        return List.of(
                AnalyticsSummaryDto.SalesForecastDto.builder().name("Jan").sales(190).predicted(200).lowerBound(175).upperBound(220).isHistorical(true).build(),
                AnalyticsSummaryDto.SalesForecastDto.builder().name("Feb").sales(220).predicted(230).lowerBound(200).upperBound(250).isHistorical(true).build(),
                AnalyticsSummaryDto.SalesForecastDto.builder().name("Mar").sales(260).predicted(255).lowerBound(230).upperBound(280).isHistorical(true).build(),
                AnalyticsSummaryDto.SalesForecastDto.builder().name("Apr").sales(245).predicted(270).lowerBound(220).upperBound(290).isHistorical(true).build(),
                AnalyticsSummaryDto.SalesForecastDto.builder().name("May").sales(290).predicted(300).lowerBound(260).upperBound(330).isHistorical(true).build(),
                AnalyticsSummaryDto.SalesForecastDto.builder().name("Jun").sales(275).predicted(315).lowerBound(250).upperBound(345).isHistorical(true).build()
        );
    }

    private List<AnalyticsSummaryDto.ProfitAnalysisDto> generateDemoProfitAnalysis(String range, BigDecimal totalRev, BigDecimal totalCost) {
        if ("today".equals(range)) {
            BigDecimal rev = totalRev.compareTo(BigDecimal.ZERO) > 0 ? totalRev : BigDecimal.valueOf(8500);
            BigDecimal cost = totalCost.compareTo(BigDecimal.ZERO) > 0 ? totalCost : BigDecimal.valueOf(4675);
            BigDecimal profit = rev.subtract(cost);
            return List.of(
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Morning").revenue(rev.multiply(BigDecimal.valueOf(0.35)).setScale(2, RoundingMode.HALF_UP)).cost(cost.multiply(BigDecimal.valueOf(0.35)).setScale(2, RoundingMode.HALF_UP)).profit(profit.multiply(BigDecimal.valueOf(0.35)).setScale(2, RoundingMode.HALF_UP)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Afternoon").revenue(rev.multiply(BigDecimal.valueOf(0.40)).setScale(2, RoundingMode.HALF_UP)).cost(cost.multiply(BigDecimal.valueOf(0.40)).setScale(2, RoundingMode.HALF_UP)).profit(profit.multiply(BigDecimal.valueOf(0.40)).setScale(2, RoundingMode.HALF_UP)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Evening").revenue(rev.multiply(BigDecimal.valueOf(0.25)).setScale(2, RoundingMode.HALF_UP)).cost(cost.multiply(BigDecimal.valueOf(0.25)).setScale(2, RoundingMode.HALF_UP)).profit(profit.multiply(BigDecimal.valueOf(0.25)).setScale(2, RoundingMode.HALF_UP)).build()
            );
        } else if ("7d".equals(range)) {
            return List.of(
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Mon").revenue(BigDecimal.valueOf(4100)).cost(BigDecimal.valueOf(2255)).profit(BigDecimal.valueOf(1845)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Tue").revenue(BigDecimal.valueOf(4100)).cost(BigDecimal.valueOf(2255)).profit(BigDecimal.valueOf(1845)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Wed").revenue(BigDecimal.valueOf(4700)).cost(BigDecimal.valueOf(2585)).profit(BigDecimal.valueOf(2115)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Thu").revenue(BigDecimal.valueOf(4700)).cost(BigDecimal.valueOf(2585)).profit(BigDecimal.valueOf(2115)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Fri").revenue(BigDecimal.valueOf(7100)).cost(BigDecimal.valueOf(3905)).profit(BigDecimal.valueOf(3195)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Sat").revenue(BigDecimal.valueOf(7100)).cost(BigDecimal.valueOf(3905)).profit(BigDecimal.valueOf(3195)).build(),
                    AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Sun").revenue(BigDecimal.valueOf(6200)).cost(BigDecimal.valueOf(3410)).profit(BigDecimal.valueOf(2790)).build()
            );
        }

        return List.of(
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Jan").revenue(BigDecimal.valueOf(32000)).cost(BigDecimal.valueOf(17600)).profit(BigDecimal.valueOf(14400)).build(),
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Feb").revenue(BigDecimal.valueOf(38000)).cost(BigDecimal.valueOf(20900)).profit(BigDecimal.valueOf(17100)).build(),
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Mar").revenue(BigDecimal.valueOf(45000)).cost(BigDecimal.valueOf(24750)).profit(BigDecimal.valueOf(20250)).build(),
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Apr").revenue(BigDecimal.valueOf(41000)).cost(BigDecimal.valueOf(22550)).profit(BigDecimal.valueOf(18450)).build(),
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("May").revenue(BigDecimal.valueOf(49500)).cost(BigDecimal.valueOf(27225)).profit(BigDecimal.valueOf(22275)).build(),
                AnalyticsSummaryDto.ProfitAnalysisDto.builder().month("Jun").revenue(BigDecimal.valueOf(43000)).cost(BigDecimal.valueOf(23650)).profit(BigDecimal.valueOf(19350)).build()
        );
    }

    private List<AnalyticsSummaryDto.WorstProductDto> calculateWorstProducts(
            List<Product> products, Map<Long, Integer> productUnitsSold, Map<Long, BigDecimal> productRevenueMap) {
        return products.stream()
                .map(p -> {
                    int sold = productUnitsSold.getOrDefault(p.getId(), 0);
                    BigDecimal rev = productRevenueMap.getOrDefault(p.getId(), BigDecimal.ZERO);
                    int stock = p.getAvailableStock() != null ? p.getAvailableStock() : 0;
                    BigDecimal tiedUp = p.getEffectiveCostPrice().multiply(BigDecimal.valueOf(stock));
                    String status = sold == 0 ? "Dead Stock" : (sold <= 1 ? "Slow Moving" : "Underperforming");
                    return AnalyticsSummaryDto.WorstProductDto.builder()
                            .id(p.getId())
                            .sku(p.getSku())
                            .name(p.getName())
                            .category(p.getCategory() != null ? p.getCategory().getName() : "General")
                            .stock(stock)
                            .unitsSold(sold)
                            .revenue(rev)
                            .tiedUpCapital(tiedUp)
                            .status(status)
                            .build();
                })
                .sorted((w1, w2) -> {
                    int cmp = Integer.compare(w1.getUnitsSold(), w2.getUnitsSold());
                    if (cmp != 0) return cmp;
                    return w2.getTiedUpCapital().compareTo(w1.getTiedUpCapital());
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<AnalyticsSummaryDto.CategoryPerformanceDto> calculateCategoryPerformance(
            List<Category> categories, List<Product> products,
            Map<String, BigDecimal> categoryRevenueMap, Map<String, Integer> categoryUnitsSold,
            Map<String, BigDecimal> categoryCostMap, Map<String, Integer> categoryStockMap) {
        return categories.stream()
                .map(cat -> {
                    String name = cat.getName();
                    BigDecimal rev = categoryRevenueMap.getOrDefault(name, BigDecimal.ZERO);
                    int units = categoryUnitsSold.getOrDefault(name, 0);
                    BigDecimal cost = categoryCostMap.getOrDefault(name, BigDecimal.ZERO);
                    BigDecimal profit = rev.subtract(cost);
                    double margin = rev.compareTo(BigDecimal.ZERO) > 0
                            ? profit.divide(rev, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                            : 0.0;
                    long activeCount = products.stream().filter(p -> p.getCategory() != null && p.getCategory().getId().equals(cat.getId())).count();
                    int stock = categoryStockMap.getOrDefault(name, 0);
                    BigDecimal val = products.stream()
                            .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(cat.getId()))
                            .map(p -> (p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(p.getAvailableStock() != null ? p.getAvailableStock() : 0)))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return AnalyticsSummaryDto.CategoryPerformanceDto.builder()
                            .category(name)
                            .revenue(rev)
                            .unitsSold(units)
                            .costOfGoods(cost)
                            .grossProfit(profit)
                            .grossMargin(Math.round(margin * 10.0) / 10.0)
                            .activeProductsCount((int) activeCount)
                            .totalStock(stock)
                            .inventoryValuation(val)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private BigDecimal calculateSkuRestocks(
            List<Product> products, Map<Long, Integer> productUnitsSold, long horizonDays,
            List<AnalyticsSummaryDto.SkuRestockDto> skuRestocks) {
        BigDecimal totalBudget = BigDecimal.ZERO;
        for (Product p : products) {
            int stock = p.getAvailableStock() != null ? p.getAvailableStock() : 0;
            int leadTime = p.getLeadTimeDays() != null ? p.getLeadTimeDays() : 7;
            int sold = productUnitsSold.getOrDefault(p.getId(), 0);
            double dailyDemand = horizonDays > 0 ? (double) sold / horizonDays : 0.0;

            int ss = (int) Math.ceil(1.65 * Math.sqrt(leadTime) * Math.max(0.5, dailyDemand));
            int ltd = (int) Math.ceil(dailyDemand * leadTime);
            int rop = ltd + ss;
            int needed = Math.max(0, rop - stock);

            String urgency;
            if (stock == 0) urgency = "Critical";
            else if (stock <= ltd) urgency = "High";
            else if (stock <= rop) urgency = "Moderate";
            else urgency = "Adequate";

            BigDecimal unitCost = p.getEffectiveCostPrice();
            BigDecimal restockCost = unitCost.multiply(BigDecimal.valueOf(needed));
            if (needed > 0) {
                totalBudget = totalBudget.add(restockCost);
            }

            if (stock <= rop || stock <= 20) {
                skuRestocks.add(AnalyticsSummaryDto.SkuRestockDto.builder()
                        .sku(p.getSku())
                        .name(p.getName())
                        .category(p.getCategory() != null ? p.getCategory().getName() : "General")
                        .currentStock(stock)
                        .leadTimeDays(leadTime)
                        .safetyStock(ss)
                        .reorderPoint(rop)
                        .neededUnits(needed)
                        .unitCost(unitCost)
                        .totalRestockCost(restockCost)
                        .urgency(urgency)
                        .build());
            }
        }
        return totalBudget;
    }
}
