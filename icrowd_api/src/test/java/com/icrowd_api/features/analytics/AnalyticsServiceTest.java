package com.icrowd_api.features.analytics;

import com.icrowd_api.features.analytics.dto.AnalyticsSummaryDto;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnalyticsServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private Category electronicsCategory;
    private Category accessoriesCategory;
    private Product headphoneProduct;
    private Product caseProduct;

    @BeforeEach
    void setUp() {
        electronicsCategory = Category.builder().id(1L).name("Headset").build();
        accessoriesCategory = Category.builder().id(2L).name("Case").build();

        headphoneProduct = Product.builder()
                .id(101L)
                .name("Wireless ANC Headphone")
                .sku("SKU-AUDIO-01")
                .category(electronicsCategory)
                .price(new BigDecimal("10000.00"))
                .costPrice(new BigDecimal("6000.00")) // 40% margin
                .availableStock(15)
                .leadTimeDays(7)
                .isActive(true)
                .build();

        caseProduct = Product.builder()
                .id(102L)
                .name("Silicone Protective Case")
                .sku("SKU-CASE-01")
                .category(accessoriesCategory)
                .price(new BigDecimal("2000.00"))
                .costPrice(new BigDecimal("800.00")) // 60% margin
                .availableStock(50)
                .leadTimeDays(5)
                .isActive(true)
                .build();

        when(productRepository.findAllActiveProductsList()).thenReturn(List.of(headphoneProduct, caseProduct));
        when(categoryRepository.findAll()).thenReturn(List.of(electronicsCategory, accessoriesCategory));
    }

    @Nested
    @DisplayName("1. Qualifying Order and Payment State Tests")
    class QualifyingOrderTests {

        @Test
        @DisplayName("Failed, cancelled, and unpaid orders must NOT contribute to sales totals")
        void nonQualifyingOrdersAreExcludedFromSales() {
            // Given: 1 completed order and 3 invalid orders (CANCELLED, FAILED, PENDING_PAYMENT unpaid)
            Order validOrder = createOrder(1L, OrderStatus.COMPLETED, PaymentStatus.PAID, headphoneProduct, 2, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            Order cancelledOrder = createOrder(2L, OrderStatus.CANCELLED, PaymentStatus.CANCELLED, headphoneProduct, 5, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            Order failedOrder = createOrder(3L, OrderStatus.FAILED, PaymentStatus.FAILED, caseProduct, 10, new BigDecimal("2000.00"), new BigDecimal("800.00"));
            Order unpaidOrder = createOrder(4L, OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING, headphoneProduct, 3, new BigDecimal("10000.00"), new BigDecimal("6000.00"));

            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(validOrder, cancelledOrder, failedOrder, unpaidOrder));

            // When
            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            // Then
            // Only the valid order (2 headphones) should be counted:
            assertEquals(2, result.getOverview().getTotalUnitsSold(), "Only qualifying orders must contribute to units sold");
            assertEquals(0, new BigDecimal("20000.00").compareTo(result.getOverview().getTotalRevenue()), "Only qualifying orders must contribute to revenue");
            assertEquals(1, result.getOverview().getQualifyingOrderCount());
            assertFalse(result.getIsDemoData());
        }

        @Test
        @DisplayName("Cash on Delivery orders in CONFIRMED state with DUE_ON_DELIVERY qualify")
        void codConfirmedOrdersQualify() {
            Order codOrder = createOrder(5L, OrderStatus.CONFIRMED, PaymentStatus.DUE_ON_DELIVERY, caseProduct, 4, new BigDecimal("2000.00"), new BigDecimal("800.00"));
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(codOrder));

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertEquals(4, result.getOverview().getTotalUnitsSold());
            assertEquals(0, new BigDecimal("8000.00").compareTo(result.getOverview().getTotalRevenue()));
            assertEquals(1, result.getOverview().getQualifyingOrderCount());
        }
    }

    @Nested
    @DisplayName("2. Actual Low / Zero Sales vs Clearly Marked Demo Mode")
    class ActualSalesVsDemoModeTests {

        @Test
        @DisplayName("Zero sales must report actual 0 units and 0 revenue (no fake figures invented)")
        void zeroSalesReportsActualZeroInLiveMode() {
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of());

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertEquals(0, result.getOverview().getTotalUnitsSold(), "Zero units sold must remain 0");
            assertEquals(0, BigDecimal.ZERO.compareTo(result.getOverview().getTotalRevenue()), "Zero revenue must remain 0");
            assertEquals(0, BigDecimal.ZERO.compareTo(result.getOverview().getGrossProfit()));
            assertEquals(0.0, result.getOverview().getProfitMargin());
            assertFalse(result.getIsDemoData());
            assertTrue(result.getDataSource().contains("0 qualifying orders"));
        }

        @Test
        @DisplayName("Fewer than five units sold reports actual low sales in Live Mode without inventing data")
        void fewerThanFiveUnitsSoldReportsActualsInLiveMode() {
            Order singleOrder = createOrder(1L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 1, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(singleOrder));

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertEquals(1, result.getOverview().getTotalUnitsSold(), "Exactly 1 unit sold must be reported");
            assertEquals(0, new BigDecimal("10000.00").compareTo(result.getOverview().getTotalRevenue()));
            assertFalse(result.getIsDemoData(), "Live mode must not be marked as demo");
        }

        @Test
        @DisplayName("Demo mode is clearly marked and provides simulated data when explicitly requested")
        void demoModeIsClearlyMarkedWhenRequested() {
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of());

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, true);

            assertTrue(result.getIsDemoData(), "Demo mode flag must be true");
            assertTrue(result.getOverview().getIsDemoData());
            assertTrue(result.getDataSource().contains("DEMO MODE"));
            assertTrue(result.getOverview().getTotalUnitsSold() >= 15);
        }
    }

    @Nested
    @DisplayName("3. Purchase-Time Cost and Profit Calculation Tests")
    class ProfitCalculationTests {

        @Test
        @DisplayName("Gross profit is calculated from purchase-time cost (COGS), NOT a fixed 45% margin")
        void profitUsesPurchaseTimeCost() {
            // Case product: Price = 2000, Cost = 800 (Gross Profit per unit = 1200, Margin = 60%)
            Order order = createOrder(1L, OrderStatus.COMPLETED, PaymentStatus.PAID, caseProduct, 10, new BigDecimal("2000.00"), new BigDecimal("800.00"));
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(order));

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            BigDecimal expectedRevenue = new BigDecimal("20000.00");
            BigDecimal expectedCost = new BigDecimal("8000.00");
            BigDecimal expectedProfit = new BigDecimal("12000.00"); // 60% margin, NOT 45%

            assertEquals(0, expectedRevenue.compareTo(result.getOverview().getTotalRevenue()));
            assertEquals(0, expectedCost.compareTo(result.getOverview().getTotalCost()));
            assertEquals(0, expectedProfit.compareTo(result.getOverview().getGrossProfit()));
            assertEquals(60.0, result.getOverview().getProfitMargin(), 0.01, "Margin must be exactly 60%, not hardcoded 45%");
        }
    }

    @Nested
    @DisplayName("4. Custom Date Range Validation Tests")
    class DateRangeValidationTests {

        @Test
        @DisplayName("Reversed date range (startDate after endDate) is rejected with IllegalArgumentException")
        void reversedDateRangeIsRejected() {
            LocalDate start = LocalDate.now();
            LocalDate end = LocalDate.now().minusDays(5);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                    analyticsService.getAnalyticsSummary("custom", start, end, false)
            );
            assertTrue(ex.getMessage().contains("cannot be after end date"));
        }

        @Test
        @DisplayName("Incomplete date range (startDate null, endDate present) is rejected")
        void incompleteDateRangeIsRejected() {
            LocalDate end = LocalDate.now();

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                    analyticsService.getAnalyticsSummary("custom", null, end, false)
            );
            assertTrue(ex.getMessage().contains("Both startDate and endDate must be provided"));
        }

        @Test
        @DisplayName("Future end date is rejected")
        void futureEndDateIsRejected() {
            LocalDate start = LocalDate.now().minusDays(5);
            LocalDate end = LocalDate.now().plusDays(10);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                    analyticsService.getAnalyticsSummary("custom", start, end, false)
            );
            assertTrue(ex.getMessage().contains("cannot be in the future"));
        }
    }

    @Nested
    @DisplayName("5. Prediction and Inventory Replenishment Tests")
    class PredictionSystemTests {

        @Test
        @DisplayName("Insufficient historical data (<5 transactions) is flagged as INSUFFICIENT_DATA")
        void insufficientDataFlaggedProperly() {
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of());

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertNotNull(result.getRestockPredictions());
            for (AnalyticsSummaryDto.RestockPredictionDto pred : result.getRestockPredictions()) {
                assertEquals("INSUFFICIENT_DATA", pred.getDataSufficiency());
                assertTrue(pred.getNotes().contains("Insufficient historical orders"));
            }
        }

        @Test
        @DisplayName("Replenishment calculates safety stock and lead-time demand accurately")
        void replenishmentCalculations() {
            // Given: 10 units sold across period
            Order order = createOrder(1L, OrderStatus.COMPLETED, PaymentStatus.PAID, headphoneProduct, 10, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(order));
            when(orderRepository.findQualifyingOrdersBetween(any(), any(), any())).thenReturn(List.of(order));

            AnalyticsSummaryDto result = analyticsService.getAnalyticsSummary("30d", null, null, false);

            AnalyticsSummaryDto.RestockPredictionDto headsetPred = result.getRestockPredictions().stream()
                    .filter(p -> "Headset".equals(p.getCategory()))
                    .findFirst()
                    .orElseThrow();

            assertNotNull(headsetPred);
            assertTrue(headsetPred.getLeadTimeDays() > 0);
            assertTrue(headsetPred.getSafetyStock() > 0);
            assertTrue(headsetPred.getReorderPoint() > 0);
            assertNotNull(headsetPred.getUrgency());
        }
    }

    @Nested
    @DisplayName("6. Advanced Business Intelligence & Customer Analytics Tests")
    class AdvancedBusinessIntelligenceTests {

        @Test
        @DisplayName("Should correctly calculate Customer Analytics (CLV, AOV, Repeat Rate)")
        void testCustomerAnalyticsCalculation() {
            // Customer 1 places 2 orders
            Order o1 = createOrder(1L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 1, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            Order o2 = createOrder(2L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 1, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            // Customer 2 places 1 order
            Order o3 = createOrder(3L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 1, new BigDecimal("10000.00"), new BigDecimal("6000.00"));
            o3.setShippingEmail("customer2@example.com");

            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(o1, o2, o3));

            AnalyticsSummaryDto summary = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertNotNull(summary.getCustomerAnalytics());
            assertEquals(2, summary.getCustomerAnalytics().getTotalCustomers()); // 2 distinct customers
            assertEquals(1, summary.getCustomerAnalytics().getRepeatCustomerCount()); // 1 repeat customer (placed 2 orders)
            assertEquals(50.0, summary.getCustomerAnalytics().getRepeatPurchaseRate()); // 1/2 = 50%
            assertEquals(0, new BigDecimal("10000.00").compareTo(summary.getCustomerAnalytics().getAverageOrderValue()));
            assertTrue(summary.getCustomerAnalytics().getCustomerLifetimeValue().compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("Should identify Dead Stock and Slow Moving products")
        void testWorstPerformingDeadStock() {
            // headphoneProduct has 1 order, caseProduct has 0 orders (Dead Stock)
            Order o1 = createOrder(1L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 2, new BigDecimal("10000.00"), new BigDecimal("6000.00"));

            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(o1));

            AnalyticsSummaryDto summary = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertNotNull(summary.getWorstProducts());
            assertFalse(summary.getWorstProducts().isEmpty());
            // caseProduct had 0 units sold, so it must be flagged as "Dead Stock"
            AnalyticsSummaryDto.WorstProductDto worst = summary.getWorstProducts().stream()
                    .filter(w -> w.getId().equals(102L))
                    .findFirst()
                    .orElse(null);
            assertNotNull(worst);
            assertEquals("Dead Stock", worst.getStatus());
            assertEquals(0, worst.getUnitsSold());
            assertEquals(0, new BigDecimal("40000.00").compareTo(worst.getTiedUpCapital())); // 50 * 800 = 40,000
        }

        @Test
        @DisplayName("Should generate Category Performance Matrix and SKU Restock Budget")
        void testCategoryPerformanceAndRestockBudget() {
            Order o1 = createOrder(1L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 2, new BigDecimal("10000.00"), new BigDecimal("6000.00"));

            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(o1));

            AnalyticsSummaryDto summary = analyticsService.getAnalyticsSummary("all", null, null, false);

            assertNotNull(summary.getCategoryPerformance());
            assertFalse(summary.getCategoryPerformance().isEmpty());

            assertNotNull(summary.getSkuRestockPredictions());
            assertNotNull(summary.getTotalRestockBudget());
            assertTrue(summary.getTotalRestockBudget().compareTo(BigDecimal.ZERO) >= 0);
        }

        @Test
        @DisplayName("Should generate daily and weekly trend grain data")
        void testDailyAndWeeklyGrain() {
            Order o1 = createOrder(1L, OrderStatus.DELIVERED, PaymentStatus.PAID, headphoneProduct, 1, new BigDecimal("10000.00"), new BigDecimal("6000.00"));

            when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(o1));

            AnalyticsSummaryDto dailySummary = analyticsService.getAnalyticsSummary("all", null, null, false, "daily");
            assertEquals("daily", dailySummary.getTrendGrain());
            assertEquals(14, dailySummary.getSalesForecast().size()); // 14 daily points

            AnalyticsSummaryDto weeklySummary = analyticsService.getAnalyticsSummary("all", null, null, false, "weekly");
            assertEquals("weekly", weeklySummary.getTrendGrain());
            assertEquals(6, weeklySummary.getSalesForecast().size()); // 6 weekly points
        }
    }

    private Order createOrder(Long id, OrderStatus status, PaymentStatus paymentStatus, Product product, int quantity, BigDecimal price, BigDecimal cost) {
        Order order = Order.builder()
                .id(id)
                .orderReference("ORD-TEST-" + id)
                .status(status)
                .paymentStatus(paymentStatus)
                .paymentMethod(PaymentMethod.CARD)
                .deliveryType(DeliveryType.STANDARD)
                .createdAt(LocalDateTime.now().minusDays(2))
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(id * 10)
                .order(order)
                .product(product)
                .quantity(quantity)
                .priceAtTimeOfPurchase(price)
                .costPriceAtTimeOfPurchase(cost)
                .build();

        order.getItems().add(item);
        order.setTotalAmount(price.multiply(BigDecimal.valueOf(quantity)));
        return order;
    }
}
