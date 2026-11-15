import com.icrowd_api.IcrowdApiApplication;
import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.analytics.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.nio.charset.StandardCharsets;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

public class RecheckExtraProbe {
  static MockMvc mvc;
  static final ObjectMapper json = new ObjectMapper();
  static final List<Map<String,Object>> results = new ArrayList<>();
  static void note(String check, Object... kv) {
    Map<String,Object> entry = new LinkedHashMap<>(); entry.put("check", check);
    for(int i=0;i<kv.length;i+=2) entry.put(kv[i].toString(), kv[i+1]);
    results.add(entry);
    try { System.out.println("AUDIT_RESULT " + json.writeValueAsString(entry)); } catch(Exception e) {throw new RuntimeException(e);}
  }
  static MvcResult postJson(String path, String token, Object body) throws Exception {
    var request=post(path).contentType("application/json").content(json.writeValueAsString(body));
    if(token!=null) request.header("Authorization", "Bearer "+token);
    return mvc.perform(request).andReturn();
  }
  static Map body(MvcResult result) throws Exception {return json.readValue(result.getResponse().getContentAsString(),Map.class);}
  static String login(String email,String password) throws Exception {
    var result=postJson("/api/auth/login",null,Map.of("email",email,"password",password));
    if(result.getResponse().getStatus()!=200) throw new IllegalStateException("Audit login failed");
    return body(result).get("token").toString();
  }
  static Map<String,Object> order(long product, String key, String promo) {
    Map<String,Object> result=new LinkedHashMap<>();
    result.put("checkoutKey",key); result.put("shippingFullName","Audit Customer");
    result.put("shippingPhone","0771234567"); result.put("shippingEmail","audit@example.test");
    result.put("shippingAddress","Synthetic test address"); result.put("shippingDistrict","Colombo");
    result.put("paymentMethod","CARD"); result.put("deliveryType","STANDARD");
    result.put("items",List.of(Map.of("productId",product,"quantity",1)));
    if(promo!=null) result.put("promoCode",promo);
    return result;
  }
  public static void main(String[] args) throws Exception {
    System.setProperty("spring.devtools.restart.enabled","false");
    try(ConfigurableApplicationContext context=SpringApplication.run(IcrowdApiApplication.class,
      "--spring.config.location=optional:classpath:/audit-no-file.properties",
      "--spring.datasource.url=jdbc:h2:mem:audit_probe;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
      "--spring.datasource.username=sa", "--spring.datasource.password=",
      "--spring.jpa.hibernate.ddl-auto=create-drop", "--spring.jpa.open-in-view=true",
      "--spring.jpa.properties.hibernate.generate_statistics=true",
      "--spring.profiles.active=audit", "--app.marketing.enabled=false",
      "--app.marketing.interval-ms=3600000", "--payhere.reconcile-delay-ms=3600000",
      "--payhere.merchant-id=audit-only", "--payhere.merchant-secret=audit-test-secret", "--payhere.notify-url=https://example.test/notify",
      "--payhere.app-id=", "--payhere.app-secret=", "--server.address=127.0.0.1", "--server.port=0",
      "--logging.level.root=WARN", "--logging.level.org.hibernate.stat=OFF")) {
      mvc=MockMvcBuilders.webAppContextSetup((WebApplicationContext)context)
        .apply(SecurityMockMvcConfigurers.springSecurity()).build();
      TransactionTemplate tx=new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
      var users=context.getBean(UserRepository.class);
      var orders=context.getBean(OrderRepository.class);
      var products=context.getBean(ProductRepository.class);
      var analytics=context.getBean(AnalyticsService.class);

      tx.executeWithoutResult(s -> orders.deleteAll());
      String admin=login("admin@icrowd.com","Admin@1234");
      String buyer=login("customer@icrowd.com","Customer@1234");
      long product=products.findBySku("SKU-001").orElseThrow().getId();
      tx.executeWithoutResult(s -> {var p=products.findById(product).orElseThrow(); p.setPrice(new java.math.BigDecimal("100"));p.setCostPrice(new java.math.BigDecimal("40"));});
      postJson("/api/promo",admin,Map.of("code","AUDIT20","discountType","FIXED","discountValue",20,"customerEligibility","ALL"));
      var fixture=order(product,"audit-profit-day","AUDIT20");fixture.put("paymentMethod","COD");
      var created=postJson("/api/orders",buyer,fixture);
      long orderId=((Number)body(created).get("orderId")).longValue();
      tx.executeWithoutResult(s -> orders.updateOrderCreatedAt(orderId,java.time.LocalDate.now().atTime(10,0)));
      var actual=tx.execute(s -> analytics.getAnalyticsSummary("today",null,null,false));
      note("profit_time_buckets", "orderTime","10:00", "demo",false,"revenue",actual.getOverview().getTotalRevenue(),"discount",orders.findById(orderId).orElseThrow().getDiscountAmount(),"netProfit",actual.getOverview().getNetProfit(),"buckets",actual.getProfitAnalysis());
      var update=mvc.perform(put("/api/products/"+product).header("Authorization","Bearer "+admin).contentType("application/json").content("{\"costPrice\":25,\"leadTimeDays\":99}")).andReturn();
      note("cannot_maintain_cost_and_lead_time","status",update.getResponse().getStatus(),"requestedCost",25,"savedCost",products.findById(product).orElseThrow().getCostPrice(),"requestedLeadTime",99,"savedLeadTime",products.findById(product).orElseThrow().getLeadTimeDays());
      tx.executeWithoutResult(s -> {var o=orders.findById(orderId).orElseThrow();o.setStatus(OrderStatus.DELIVERED);});
      var review=postJson("/api/products/"+product+"/reviews",buyer,Map.of("rating",5,"comment","Delivered order review test"));
      note("delivered_customer_review","orderStatus","DELIVERED","reviewStatus",review.getResponse().getStatus());
      var userService=context.getBean(UserService.class);
      userService.promoteToAdmin("customer@icrowd.com","admin@icrowd.com");
      var ids=List.of(users.findByEmail("admin@icrowd.com").orElseThrow().getId(),users.findByEmail("customer@icrowd.com").orElseThrow().getId());
      var barrier=new java.util.concurrent.CyclicBarrier(2);
      org.aopalliance.intercept.MethodInterceptor gate=invocation -> {
        Object value=invocation.proceed();
        if(Thread.currentThread().getName().startsWith("audit-last-admin-") && invocation.getMethod().getName().equals("countByRoleAndAccountStatus")) barrier.await(10,java.util.concurrent.TimeUnit.SECONDS);
        return value;
      };
      var advised=(org.springframework.aop.framework.Advised)users; advised.addAdvice(0,gate);
      var failures=new java.util.concurrent.ConcurrentLinkedQueue<String>();
      List<Thread> threads=new ArrayList<>();
      for(int i=0;i<2;i++){final long id=ids.get(i); Thread t=new Thread(()->{try{userService.deactivateUser(id,"admin@icrowd.com");}catch(Throwable e){failures.add(e.getClass().getSimpleName());}},"audit-last-admin-"+i);threads.add(t);t.start();}
      for(Thread t:threads)t.join(15000); advised.removeAdvice(gate);
      note("concurrent_last_admin_deactivation","remainingActiveAdmins",users.countByRoleAndAccountStatus("ADMIN","ACTIVE"),"requestErrors",failures);
      System.out.println("AUDIT_COMPLETE "+results.size());
    }
  }
}
