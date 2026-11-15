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

public class RecheckProbe {
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
      note("startup_demonstration_orders", "profile", "audit", "ordersCreatedWithoutRequest", orders.count());
      tx.executeWithoutResult(s -> orders.deleteAll());
      var overview=tx.execute(s -> analytics.getAnalyticsSummary().getOverview());
      note("analytics_empty_database", "actualOrders",orders.count(),"reportedRevenue",overview.getTotalRevenue(),"reportedUnits",overview.getTotalUnitsSold());
      String admin=login("admin@icrowd.com","Admin@1234");
      note("default_admin_login", "status",200);
      String knownSecret="404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
      String forged=io.jsonwebtoken.Jwts.builder().setSubject("admin@icrowd.com")
        .setExpiration(new Date(System.currentTimeMillis()+60000))
        .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(knownSecret.getBytes(StandardCharsets.UTF_8))).compact();
      var forgedResult=mvc.perform(get("/api/admin/users").header("Authorization","Bearer "+forged)).andReturn();
      note("known_default_jwt_secret", "adminEndpointStatus",forgedResult.getResponse().getStatus(),"tokenVersionClaimPresent",false);
      for(String email:List.of("auditowner@example.test","AuditOwner@example.test")) {
        var registered=postJson("/api/auth/register",null,Map.of("email",email,"password","AuditPassword!123","firstName","Audit","lastName","Customer"));
        note("register_email_variant", "email",email,"status",registered.getResponse().getStatus());
      }
      String owner=login("auditowner@example.test","AuditPassword!123");
      String variant=login("AuditOwner@example.test","AuditPassword!123");
      long product=products.findBySku("SKU-001").orElseThrow().getId();
      var created=postJson("/api/orders",owner,order(product,"audit-case",null));
      if(created.getResponse().getStatus()!=200) throw new IllegalStateException("Order creation failed: "+created.getResponse().getContentAsString());
      long orderId=((Number)body(created).get("orderId")).longValue();
      var read=mvc.perform(get("/api/orders/"+orderId+"/payment-status").header("Authorization","Bearer "+variant)).andReturn();
      var switched=postJson("/api/orders/"+orderId+"/switch-to-cod",variant,Map.of());
      note("case_variant_order_access", "ownerUserId",users.findByEmail("auditowner@example.test").orElseThrow().getId(),
        "otherUserId",users.findByEmail("AuditOwner@example.test").orElseThrow().getId(),"readStatus",read.getResponse().getStatus(),"switchStatus",switched.getResponse().getStatus());
      var promo=postJson("/api/promo",admin,Map.of("code","AUDITONCE","discountType","FIXED","discountValue",100,"totalUsageLimit",1,"perCustomerLimit",1,"customerEligibility","ALL"));
      note("create_limited_promo","status",promo.getResponse().getStatus());
      long[] ids=new long[2];
      for(int i=0;i<2;i++) {var r=postJson("/api/orders",owner,order(product,"audit-promo-"+i,"AUDITONCE")); ids[i]=((Number)body(r).get("orderId")).longValue();}
      int[] statuses=new int[2];
      for(int i=0;i<2;i++) statuses[i]=postJson("/api/orders/"+ids[i]+"/switch-to-cod",owner,Map.of()).getResponse().getStatus();
      note("promo_limit_bypassed_with_pending_orders", "limit",1,"firstConfirmationStatus",statuses[0],"secondConfirmationStatus",statuses[1]);
      var over=postJson("/api/promo",admin,Map.of("code","AUDIT150","discountType","PERCENTAGE","discountValue",150,"customerEligibility","ALL"));
      var negative=postJson("/api/orders",owner,order(product,"audit-negative","AUDIT150"));
      note("percentage_above_100", "promoStatus",over.getResponse().getStatus(),"orderStatus",negative.getResponse().getStatus(),"orderTotal",body(negative).get("totalAmount"));
      var card=postJson("/api/orders",owner,order(product,"audit-chargeback",null));
      long cardId=((Number)body(card).get("orderId")).longValue();
      var payment=postJson("/api/payments/initiate",owner,Map.of("orderId",cardId,"paymentMethod","CARD"));
      String internal=body(payment).get("internalPaymentId").toString();
      String amount=new java.math.BigDecimal(body(payment).get("amount").toString()).setScale(2).toPlainString();
      for(String code:List.of("2","-3")) {
        java.util.function.Function<String,String> md5=value -> {try {return HexFormat.of().withUpperCase().formatHex(java.security.MessageDigest.getInstance("MD5").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new RuntimeException(e);}};
        String signature=md5.apply("audit-only"+internal+amount+"LKR"+code+md5.apply("audit-test-secret"));
        var notice=mvc.perform(post("/api/payments/notify").contentType("application/x-www-form-urlencoded")
          .param("merchant_id","audit-only").param("order_id",internal).param("payment_id","audit-transaction")
          .param("payhere_amount",amount).param("payhere_currency","LKR").param("status_code",code).param("md5sig",signature)).andReturn();
        note("signed_payment_notification", "providerCode",code,"httpStatus",notice.getResponse().getStatus(),"storedStatus",orders.findById(cardId).orElseThrow().getPaymentStatus().name());
      }
      int stockBefore=products.findById(product).orElseThrow().getAvailableStock();
      var loaded=new java.util.concurrent.CountDownLatch(1); var release=new java.util.concurrent.CountDownLatch(1);
      org.aopalliance.intercept.MethodInterceptor gate=invocation -> {
        Object value=invocation.proceed();
        if(Thread.currentThread().getName().equals("audit-admin-edit") && invocation.getMethod().getName().equals("findById")) {
          loaded.countDown(); if(!release.await(15,java.util.concurrent.TimeUnit.SECONDS)) throw new IllegalStateException("Audit synchronization timeout");
        }
        return value;
      };
      var advised=(org.springframework.aop.framework.Advised)products; advised.addAdvice(0,gate);
      var editError=new java.util.concurrent.atomic.AtomicReference<Throwable>();
      Thread edit=new Thread(() -> {try {context.getBean(ProductService.class).updateProduct(product,new ProductRequest(null,null,"Audit description edit",null,null,null,null,null,null),"admin@icrowd.com");}catch(Throwable e){editError.set(e);}},"audit-admin-edit");
      edit.start();
      if(!loaded.await(10,java.util.concurrent.TimeUnit.SECONDS)) throw new IllegalStateException("Audit admin edit did not load",editError.get());
      Map<String,Object> cod=order(product,"audit-race",null);cod.put("paymentMethod","COD");
      var sale=postJson("/api/orders",owner,cod);
      int stockAfterSale=products.findById(product).orElseThrow().getAvailableStock();
      release.countDown(); edit.join(15000); advised.removeAdvice(gate);
      if(editError.get()!=null) throw new RuntimeException(editError.get());
      note("admin_edit_loses_concurrent_stock_sale", "saleStatus",sale.getResponse().getStatus(),"beforeStock",stockBefore,"afterSaleStock",stockAfterSale,"afterAdminSaveStock",products.findById(product).orElseThrow().getAvailableStock());
      long before=orders.count();
      var legacy=postJson("/api/orders/checkout",owner,Map.of("paymentMethod","COD","deliveryType","STANDARD","items",List.of(Map.of("productId",product,"quantity",1))));
      boolean validJson=true;try{json.readTree(legacy.getResponse().getContentAsString());}catch(Exception e){validJson=false;}
      note("legacy_checkout_missing_shipping", "httpStatus",legacy.getResponse().getStatus(),"ordersAdded",orders.count()-before,"validJsonResponse",validJson);
      var stats=context.getBean(EntityManagerFactory.class).unwrap(SessionFactory.class).getStatistics();
      stats.clear();
      var listing=mvc.perform(get("/api/products?size=10")).andReturn();
      note("product_list_queries", "pageSize",10,"httpStatus",listing.getResponse().getStatus(),"statements",stats.getPrepareStatementCount());
      stats.clear();
      var latest=mvc.perform(get("/api/products/latest?limit=1000000")).andReturn();
      note("unbounded_latest_limit", "httpStatus",latest.getResponse().getStatus(),"productsReturned",json.readTree(latest.getResponse().getContentAsString()).size());
      tx.executeWithoutResult(s -> {var p=products.findById(product).orElseThrow();p.setAvailableStock(0);p.setIsActive(false);p.setPrice(java.math.BigDecimal.ONE);products.save(p);});
      context.getBean("loadProductData",CommandLineRunner.class).run();
      var reset=products.findById(product).orElseThrow();
      note("startup_loader_overwrites_inventory", "beforeStock",0,"afterStock",reset.getAvailableStock(),"beforeActive",false,"afterActive",reset.getIsActive(),"beforePrice",1,"afterPrice",reset.getPrice());
      postJson("/api/auth/register",null,Map.of("email","promotion-target@example.test","password","AuditPassword!123","firstName","Audit","lastName","Target"));
      var promote=postJson("/api/auth/create-admin",admin,Map.of("email","promotion-target@example.test"));
      note("promotion_without_reauthentication", "httpStatus",promote.getResponse().getStatus(),"newRole",users.findByEmail("promotion-target@example.test").orElseThrow().getRole());
      
      var detail=mvc.perform(get("/api/products/"+product)).andReturn();
      var detailJson=json.readTree(detail.getResponse().getContentAsString());
      note("public_internal_cost", "httpStatus",detail.getResponse().getStatus(),"costPrice",detailJson.get("costPrice"),"effectiveCostPrice",detailJson.get("effectiveCostPrice"));
      var fbt=mvc.perform(get("/api/recommendations/frequently-bought-together/"+product)).andReturn();
      var fbtJson=json.readTree(fbt.getResponse().getContentAsString());
      List<Map<String,Object>> bundleItems=new ArrayList<>(); bundleItems.add(Map.of("productId",product,"quantity",1));
      for(var item:fbtJson.path("bundledProducts")) bundleItems.add(Map.of("productId",item.get("id").asLong(),"quantity",1));
      var bundleOrder=order(product,"audit-bundle-price",null); bundleOrder.put("items",bundleItems);
      var bundleResult=postJson("/api/orders",owner,bundleOrder);
      long bundleId=((Number)body(bundleResult).get("orderId")).longValue();
      note("bundle_price_at_checkout","advertisedTotal",fbtJson.get("bundleTotal"),"regularTotal",fbtJson.get("regularTotal"),"checkoutSubtotal",orders.findById(bundleId).orElseThrow().getSubTotal(),"checkoutDiscount",orders.findById(bundleId).orElseThrow().getDiscountAmount());
      for(String message:List.of("delivery info","headsets","powerbanks")) {
        try {
          var chat=postJson("/api/ai/chat",null,Map.of("sessionId","audit-cache-chat","message",message));
          boolean valid=true; try{json.readTree(chat.getResponse().getContentAsString());}catch(Exception e){valid=false;}
          note("chat_cached_entity_response","message",message,"status",chat.getResponse().getStatus(),"validJson",valid,"error",chat.getResolvedException()==null?null:chat.getResolvedException().getClass().getSimpleName());
        } catch(Exception e) { note("chat_cached_entity_response","message",message,"error",e.getClass().getSimpleName(),"cause",e.getCause()==null?null:e.getCause().getClass().getSimpleName()); }
      }
      var chatService=context.getBean(com.icrowd_api.features.assistant.AiChatService.class);
      var rates=(Map<?,?>)org.springframework.test.util.ReflectionTestUtils.getField(chatService,"rateLimitStore");
      var sessions=(Map<?,?>)org.springframework.test.util.ReflectionTestUtils.getField(chatService,"sessionStore");
      rates.clear(); sessions.clear();
      for(int i=0;i<5002;i++) chatService.processMessage(new com.icrowd_api.features.assistant.AiChatRequest("audit-capacity-"+i,"help"));
      note("chat_session_capacity","advertisedCap",5000,"sessionCount",sessions.size(),"rateLimitKeyCount",rates.size());
      var prefs=postJson("/api/auth/register",null,Map.of("email","unverified@example.test","password","AuditPassword!123","firstName","Audit","lastName","Consent"));
      var marketing=context.getBean(com.icrowd_api.features.marketing.MarketingService.class);
      var subscribed=marketing.savePreference("unverified@example.test",new com.icrowd_api.features.marketing.MarketingService.PreferenceView(true,"PowerBank",""));
      note("unverified_subscription","registrationStatus",prefs.getResponse().getStatus(),"subscribedImmediately",subscribed.subscribed());
      System.out.println("AUDIT_COMPLETE "+results.size());
    }
  }
}
