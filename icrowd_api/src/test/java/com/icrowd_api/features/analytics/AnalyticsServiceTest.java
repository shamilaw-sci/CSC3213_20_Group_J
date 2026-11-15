package com.icrowd_api.features.analytics;
import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.order.Order;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:analytics-regressions;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"})
@Transactional
class AnalyticsServiceTest {
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired OrderRepository orders;
    @Autowired UserRepository users;
    @Autowired AnalyticsFacts facts;
    @Autowired EntityManager em;
    AnalyticsService service;
    Product product;
    User buyer;
    @BeforeEach void setup() {
        service=new AnalyticsService(products,categories,facts);
        String key=UUID.randomUUID().toString();
        var category=categories.save(Category.builder().name(key).build());
        product=products.save(Product.builder().sku(key).name("Headphones").category(category).price(new BigDecimal("100.00")).costPrice(new BigDecimal("40.00")).availableStock(5).leadTimeDays(9).build());
        buyer=users.save(User.builder().email(key+"@example.com").password("test-password").build());
    }
    Order sale(LocalDateTime at,OrderStatus status,PaymentStatus payment,int quantity,BigDecimal cost,BigDecimal discount) {
        Order order=Order.builder().user(buyer).status(status).paymentStatus(payment).paymentMethod(PaymentMethod.CARD).deliveryType(DeliveryType.STANDARD).discountAmount(discount).totalAmount(new BigDecimal("100").multiply(BigDecimal.valueOf(quantity))).build();
        order.getItems().add(OrderItem.builder().order(order).product(product).quantity(quantity).priceAtTimeOfPurchase(new BigDecimal("100.00")).costPriceAtTimeOfPurchase(cost).build());
        orders.saveAndFlush(order);
        em.createQuery("update Order o set o.createdAt=:at where o.id=:id").setParameter("at",at).setParameter("id",order.getId()).executeUpdate();
        return order;
    }
    Order sale(LocalDateTime at,int qty) {return sale(at,OrderStatus.DELIVERED,PaymentStatus.PAID,qty,new BigDecimal("40.00"),BigDecimal.ZERO);}
    @Test void excludesFailedUnpaidCancelledAndDisputedOrders() {
        sale(LocalDateTime.now().minusDays(2),2);
        for(var status:List.of(OrderStatus.FAILED,OrderStatus.CANCELLED,OrderStatus.PENDING_PAYMENT,OrderStatus.CHARGEBACK)) sale(LocalDateTime.now().minusDays(1),status,PaymentStatus.PAID,10,BigDecimal.TEN,BigDecimal.ZERO);
        sale(LocalDateTime.now().minusDays(1),OrderStatus.COMPLETED,PaymentStatus.CHARGEBACK,10,BigDecimal.TEN,BigDecimal.ZERO);
        var summary=service.getAnalyticsSummary();
        assertEquals(2,summary.getOverview().getTotalUnitsSold());assertEquals(1,summary.getOverview().getQualifyingOrderCount());
        assertEquals(0,new BigDecimal("200").compareTo(summary.getOverview().getTotalRevenue()));
    }
    @Test void zeroSalesRemainZeroAndDemoIsExplicit() {
        var live=service.getAnalyticsSummary();assertEquals(0,live.getOverview().getTotalUnitsSold());assertFalse(live.getIsDemoData());
        assertEquals(0,live.getOverview().getGrossProfit().signum());assertTrue(live.getDataSource().contains("0 qualifying orders"));
        assertEquals("INSUFFICIENT_DATA", live.getForecastMetrics().getDataSufficiency());
        assertNull(live.getForecastMetrics().getWape());assertNull(live.getForecastMetrics().getForecastBias());
        assertTrue(service.getAnalyticsSummary("all",null,null,true).getIsDemoData());
    }
    @Test void codConfirmedCountsAndDiscountReducesNetProfit() {
        sale(LocalDateTime.now().minusDays(1),OrderStatus.CONFIRMED,PaymentStatus.DUE_ON_DELIVERY,1,new BigDecimal("40"),new BigDecimal("20"));
        var overview=service.getAnalyticsSummary().getOverview();assertEquals(0,new BigDecimal("60").compareTo(overview.getGrossProfit()));assertEquals(0,new BigDecimal("40").compareTo(overview.getNetProfit()));
    }
    @Test void zeroCostIsRecordedAndUnknownHistoricalCostIsLabelled() {
        sale(LocalDateTime.now().minusDays(1),OrderStatus.COMPLETED,PaymentStatus.PAID,1,BigDecimal.ZERO,BigDecimal.ZERO);
        assertEquals(0,service.getAnalyticsSummary().getOverview().getTotalCost().signum());
        sale(LocalDateTime.now().minusDays(1),OrderStatus.COMPLETED,PaymentStatus.PAID,1,null,BigDecimal.ZERO);
        var result=new AnalyticsService(products,categories,facts).getAnalyticsSummary();
        assertTrue(result.getOverview().getCostsEstimated());assertTrue(result.getDataSource().contains("60%"));
        assertEquals(0,new BigDecimal("60").compareTo(result.getOverview().getTotalCost()));
    }
    @Test void everyElapsedHourIsIncludedWithoutFabricatedSplits() {
        sale(LocalDate.now().atStartOfDay().plusMinutes(1),3);
        var result=service.getAnalyticsSummary("today",null,null,false);
        assertEquals(3,result.getSalesForecast().stream().filter(p -> Boolean.TRUE.equals(p.getIsHistorical())).mapToInt(p -> p.getSales()).sum());
        var bucket=result.getProfitAnalysis().stream().filter(p -> p.getRevenue().signum()>0).toList();
        assertEquals(1,bucket.size());assertEquals("00:00",bucket.getFirst().getMonth());assertEquals(0,new BigDecimal("300").compareTo(bucket.getFirst().getRevenue()));
    }
    @Test void lastMonthIncludesDayTwentyNineThroughThirtyOne() {
        LocalDate end=LocalDate.now().withDayOfMonth(1).minusDays(1);sale(end.atTime(10,30),4);
        var result=service.getAnalyticsSummary("last_month",null,null,false,"weekly");
        assertEquals(4,result.getSalesForecast().stream().filter(p -> p.getSales()!=null).mapToInt(p -> p.getSales()).sum());
        assertEquals(0,new BigDecimal("400").compareTo(result.getProfitAnalysis().stream().map(p -> p.getRevenue()).reduce(BigDecimal.ZERO,BigDecimal::add)));
    }
    @Test void customGrainsKeepYearsSeparateAndIncludeBothBoundaries() {
        LocalDate start=LocalDate.of(2023,1,1),end=LocalDate.of(2024,1,31);
        sale(start.atTime(10,0),1);sale(end.atTime(23,59,59),2);sale(end.plusDays(1).atStartOfDay(),10);
        var monthly=service.getAnalyticsSummary("custom",start,end,false,"monthly");
        assertEquals(3,monthly.getOverview().getTotalUnitsSold());
        assertTrue(monthly.getSalesForecast().stream().anyMatch(p -> "Jan 2023".equals(p.getName()) && p.getSales()==1));
        assertTrue(monthly.getSalesForecast().stream().anyMatch(p -> "Jan 2024".equals(p.getName()) && p.getSales()==2));
        var daily=service.getAnalyticsSummary("custom",start,end,false,"daily");assertEquals(397,daily.getSalesForecast().size());
    }
    @Test void rejectsInvalidRangesAndGrainsBeforeCaching() {
        assertThrows(IllegalArgumentException.class,() -> service.getAnalyticsSummary("arbitrary",null,null,false));
        assertThrows(IllegalArgumentException.class,() -> service.getAnalyticsSummary("all",null,null,false,"arbitrary"));
        assertThrows(IllegalArgumentException.class,() -> service.getAnalyticsSummary("custom",LocalDate.now(),LocalDate.now().minusDays(1),false));
    }
    @Test void customerMetricsUseDistinctOwnersAndRealOrderCounts() {
        sale(LocalDateTime.now().minusDays(1),1);sale(LocalDateTime.now().minusDays(2),2);
        buyer=users.save(User.builder().email(UUID.randomUUID()+"@example.com").password("test").build());sale(LocalDateTime.now().minusDays(1),3);
        var c=service.getAnalyticsSummary().getCustomerAnalytics();assertEquals(2,c.getTotalCustomers());assertEquals(1,c.getRepeatCustomerCount());assertEquals(50.0,c.getRepeatPurchaseRate());
        assertEquals(0,new BigDecimal("200").compareTo(c.getAverageOrderValue()));assertEquals(2,c.getTopCustomers().size());
    }
    @Test void liveInventoryAndRestockBudgetStillUseStockAndLeadTimes() {
        var summary=service.getAnalyticsSummary();assertFalse(summary.getWorstProducts().isEmpty());assertEquals("Dead Stock",summary.getWorstProducts().getFirst().getStatus());
        assertEquals(9,summary.getSkuRestockPredictions().getFirst().getLeadTimeDays());assertNotNull(summary.getTotalRestockBudget());
        assertEquals("INSUFFICIENT_DATA",summary.getRestockPredictions().getFirst().getDataSufficiency());
    }
}
