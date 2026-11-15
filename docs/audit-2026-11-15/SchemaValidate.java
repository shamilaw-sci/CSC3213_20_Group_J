import org.hibernate.boot.*;import org.hibernate.boot.registry.*;public class SchemaValidate { public static void main(String[] args) throws Exception {
var registry=new StandardServiceRegistryBuilder()
.applySetting("hibernate.connection.driver_class","org.postgresql.Driver")
.applySetting("hibernate.connection.url",args[0]).applySetting("hibernate.connection.username","postgres").applySetting("hibernate.connection.password","postgres")
.applySetting("hibernate.connection.pool_size",1).applySetting("hibernate.hbm2ddl.auto","validate")
.applySetting("hibernate.physical_naming_strategy","org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy").build();
var metadata=new MetadataSources(registry);for(String name:new String[]{"com.icrowd_api.features.audit.AuditLog","com.icrowd_api.features.auth.Address","com.icrowd_api.features.auth.Admin","com.icrowd_api.features.auth.Customer","com.icrowd_api.features.auth.User","com.icrowd_api.features.cart.Cart","com.icrowd_api.features.cart.CartItem","com.icrowd_api.features.category.Category","com.icrowd_api.features.marketing.EmailAttempt","com.icrowd_api.features.marketing.EmailCampaign","com.icrowd_api.features.marketing.EmailDelivery","com.icrowd_api.features.marketing.EmailPreference","com.icrowd_api.features.marketing.EmailQueueLock","com.icrowd_api.features.order.Order","com.icrowd_api.features.order.OrderItem","com.icrowd_api.features.order.Payment","com.icrowd_api.features.product.Product","com.icrowd_api.features.product.ProductView","com.icrowd_api.features.promo.PromoCode","com.icrowd_api.features.promo.PromoCodeUsage","com.icrowd_api.features.question.ProductQuestion","com.icrowd_api.features.review.Review","com.icrowd_api.features.storefront.StorefrontHero"})metadata.addAnnotatedClass(Class.forName(name));
try(var factory=metadata.buildMetadata().buildSessionFactory()){
try(var em=factory.createEntityManager()) {
em.getTransaction().begin();
var user=com.icrowd_api.features.auth.User.builder().email(java.util.UUID.randomUUID()+"@example.test").password("isolated-test-only").build();em.persist(user);
var category=com.icrowd_api.features.category.Category.builder().name("Test "+java.util.UUID.randomUUID()).build();em.persist(category);
var product=com.icrowd_api.features.product.Product.builder().name("Schema validation product").sku(java.util.UUID.randomUUID().toString()).category(category).price(new java.math.BigDecimal("100.00")).costPrice(new java.math.BigDecimal("40.00")).availableStock(10).build();em.persist(product);
var order=com.icrowd_api.features.order.Order.builder().user(user).status(com.icrowd_api.features.order.OrderStatus.SHIPPED).paymentStatus(com.icrowd_api.features.order.PaymentStatus.SUCCESS).paymentMethod(com.icrowd_api.features.order.PaymentMethod.CARD).deliveryType(com.icrowd_api.features.order.DeliveryType.STANDARD).subTotal(new java.math.BigDecimal("100.00")).totalAmount(new java.math.BigDecimal("100.00")).discountAmount(java.math.BigDecimal.ZERO).build();
order.getItems().add(com.icrowd_api.features.order.OrderItem.builder().order(order).product(product).quantity(1).priceAtTimeOfPurchase(new java.math.BigDecimal("100.00")).costPriceAtTimeOfPurchase(new java.math.BigDecimal("40.00")).build());em.persist(order);em.flush();
var end=java.time.LocalDateTime.now().plusMinutes(1);var start=end.minusDays(30);
var facts=new com.icrowd_api.features.analytics.AnalyticsFacts(em);
for(boolean hourly:new boolean[]{false,true}) {var result=facts.read(start,end,start,hourly);if(result.orderCount()!=1||result.products().size()!=1||result.periods().size()!=1)throw new AssertionError("Unexpected aggregate totals");}
em.getTransaction().rollback();System.out.println("PASS schema validation, checkout persistence, daily/hourly analytics queries");
}
} StandardServiceRegistryBuilder.destroy(registry);
}}