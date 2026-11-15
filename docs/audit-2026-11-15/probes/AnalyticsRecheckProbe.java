import com.icrowd_api.features.analytics.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.order.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.math.BigDecimal;
import java.time.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

public class AnalyticsRecheckProbe {
  static ObjectMapper json=new ObjectMapper();
  static void note(String name,Object...kv)throws Exception{Map<String,Object> m=new LinkedHashMap<>();m.put("check",name);for(int i=0;i<kv.length;i+=2)m.put(kv[i].toString(),kv[i+1]);System.out.println("AUDIT_RESULT "+json.writeValueAsString(m));}
  public static void main(String[] args)throws Exception {
    var products=mock(ProductRepository.class);var categories=mock(CategoryRepository.class);var orders=mock(OrderRepository.class);
    Category category=Category.builder().id(1L).name("Audit Category").build();
    Product product=Product.builder().id(1L).sku("AUDIT").name("Audit Product").category(category).price(new BigDecimal("100")).costPrice(new BigDecimal("40")).availableStock(50).build();
    when(products.findAllActiveProductsList()).thenReturn(List.of(product));when(categories.findAll()).thenReturn(List.of(category));
    OrderItem item=OrderItem.builder().product(product).quantity(1).priceAtTimeOfPurchase(new BigDecimal("100")).costPriceAtTimeOfPurchase(new BigDecimal("40")).build();
    Order order=Order.builder().id(1L).items(List.of(item)).createdAt(LocalDate.now().atTime(10,0)).status(OrderStatus.CONFIRMED).paymentStatus(PaymentStatus.DUE_ON_DELIVERY).totalAmount(new BigDecimal("100")).build();
    when(orders.findQualifyingOrdersBetween(any(),any(),any())).thenReturn(List.of(order));when(orders.findAllQualifyingOrders(any())).thenReturn(List.of(order));
    var analytics=new AnalyticsService(products,categories,orders);
    var today=analytics.getAnalyticsSummary("today",null,null,false);
    note("today_sales_chart_omits_unsampled_hour","orderHour",10,"overviewUnits",today.getOverview().getTotalUnitsSold(),"chartUnits",today.getSalesForecast().stream().mapToInt(x->x.getSales()).sum());
    order.setCreatedAt(LocalDate.now().withDayOfMonth(1).minusDays(1).atTime(10,0));
    var last=analytics.getAnalyticsSummary("last_month",null,null,false);
    note("monthly_chart_omits_final_days","orderDay",order.getCreatedAt().getDayOfMonth(),"overviewUnits",last.getOverview().getTotalUnitsSold(),"chartUnits",last.getSalesForecast().stream().mapToInt(x->x.getSales()).sum());
    for(int i=0;i<30;i++)analytics.getAnalyticsSummary("all",null,null,false,"invalid-grain-"+i);
    Map<?,?> cache=(Map<?,?>)org.springframework.test.util.ReflectionTestUtils.getField(analytics,"cache");
    note("analytics_cache_accepts_arbitrary_keys","requestsWithEquivalentGrains",30,"retainedEntries",cache.size());
    System.out.println("AUDIT_COMPLETE 3");
  }
}
