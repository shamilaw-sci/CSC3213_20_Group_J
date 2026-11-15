package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.order.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:checkout-tests;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
 "payhere.reconcile-delay-ms=3600000"})
class PaymentServiceTest {
 @Autowired OrderService orders;
 @Autowired PaymentService service;
 @Autowired ProductRepository products;
 @Autowired CategoryRepository categories;
 @Autowired UserRepository users;
 @Autowired OrderRepository orderRepository;
 @Autowired PaymentRepository payments;
 @MockitoBean PayHereClient bank;
 Product product;
 String email;
 @BeforeEach void setup() {
   String key=UUID.randomUUID().toString();
   email=key+"@test.com";
   users.save(User.builder().email(email).password("test-password").build());
   Category category=categories.save(Category.builder().name(key).build());
   product=products.save(Product.builder().sku(key).name("Last item").category(category).price(new BigDecimal("100.00")).availableStock(1).build());
 }
 CreateOrderRequest request(PaymentMethod method) {
   CheckoutItemDto item=new CheckoutItemDto(); item.setProductId(product.getId()); item.setQuantity(1);
   return CreateOrderRequest.builder().checkoutKey(UUID.randomUUID().toString()).shippingFullName("Test Customer")
     .shippingPhone("0771234567").shippingEmail(email).shippingAddress("123 Main Road").shippingDistrict("Colombo")
     .deliveryType(DeliveryType.STANDARD).paymentMethod(method).items(List.of(item)).build();
 }
 Payment start(Long orderId) {
   when(bank.checkoutUrl()).thenReturn("https://sandbox.payhere.lk/pay/checkout");
   when(bank.checkout(any(),any(),any())).thenReturn(Map.of("hash","test"));
   when(bank.refundsConfigured()).thenReturn(true);
   service.initiatePayment(email,InitiatePaymentRequest.builder().orderId(orderId).paymentMethod(PaymentMethod.CARD).build());
   return payments.findByOrderId(orderId).stream().max(Comparator.comparing(Payment::getId)).orElseThrow();
 }
 Map<String,String> result(Payment p,String status) {
   return Map.of("merchant_id","merchant","order_id",p.getInternalPaymentId(),"payment_id","pay_"+p.getId(),
     "payhere_amount",p.getAmount().toPlainString(),"payhere_currency","LKR","status_code",status.equals("succeeded")?"2":"-2");
 }
 void success(Payment p) { service.processNotification(result(p,"succeeded")); }
 @Autowired com.icrowd_api.features.promo.PromoCodeRepository promos;
 @Autowired com.icrowd_api.features.promo.PromoCodeService promoService;
 @Test void invalidPercentagesCannotCreateNegativeOrders() {
   var req = new com.icrowd_api.features.promo.PromoCodeRequest();
   req.setCode("TOOMUCH"); req.setDiscountType(com.icrowd_api.features.promo.DiscountType.PERCENTAGE);
   req.setDiscountValue(new BigDecimal("150"));
   assertThrows(com.icrowd_api.features.promo.PromoCodeInvalidException.class, () -> promoService.createPromoCode(req));
 }
 @Test void pendingPromoReservationsSerializeConcurrentOrders() throws Exception {
   String code="LIMIT"+UUID.randomUUID().toString().replace("-","");
   promos.save(com.icrowd_api.features.promo.PromoCode.builder().code(code).discountType(com.icrowd_api.features.promo.DiscountType.FIXED)
      .discountValue(BigDecimal.TEN).totalUsageLimit(1).build());
   var ready=new CountDownLatch(2);var go=new CountDownLatch(1);
   try(var executor=Executors.newFixedThreadPool(2)) {
     Callable<Boolean> checkout=() -> { var r=request(PaymentMethod.CARD);r.setPromoCode(code);ready.countDown();go.await();
       try {orders.createNewOrder(email,r);return true;} catch(IllegalArgumentException rejected) {return false;} };
     var a=executor.submit(checkout);var b=executor.submit(checkout);assertTrue(ready.await(5,TimeUnit.SECONDS));go.countDown();
     assertNotEquals(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));
   }
   assertEquals(1,promos.findByCodeIgnoreCase(code).orElseThrow().getUsageCount());
 }
 @Test void chargebackCannotBeResurrectedByAnOldSuccessNotification() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();Payment p=start(id);success(p);
   var chargeback=new HashMap<>(result(p,"succeeded"));chargeback.put("status_code","-3");service.processNotification(chargeback);success(p);
   assertEquals(PaymentStatus.CHARGEBACK,payments.findById(p.getId()).orElseThrow().getStatus());
   assertEquals(OrderStatus.CHARGEBACK,orderRepository.findById(id).orElseThrow().getStatus());
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void unverifiedPaymentsBlockNewChargesAndCodUntilMerchantResolution() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();Payment p=start(id);
   when(bank.refundsConfigured()).thenReturn(false);service.reconcilePayment(p.getId());
   assertEquals(PaymentStatus.REVIEW_REQUIRED,payments.findById(p.getId()).orElseThrow().getStatus());
   assertThrows(IllegalStateException.class,() -> start(id));
   assertThrows(IllegalArgumentException.class,() -> orders.switchToCod(email,id));
   service.resolveReview(p.getId(),"FAILED","Merchant dashboard confirms no captured payment, reference TEST-123");
   assertEquals(OrderStatus.FAILED,orderRepository.findById(id).orElseThrow().getStatus());
   assertEquals(PaymentStatus.INITIATED,start(id).getStatus());
 }
 @Test void mergedPromoDiscountReachesOrderAndPayment() {
   String code="PROMO"+UUID.randomUUID().toString().replace("-","");
   promos.save(com.icrowd_api.features.promo.PromoCode.builder().code(code)
     .discountType(com.icrowd_api.features.promo.DiscountType.FIXED).discountValue(new BigDecimal("25.00")).build());
   var req=request(PaymentMethod.CARD); req.setPromoCode(code);
   Long id=orders.createNewOrder(email,req).getOrderId();
   assertEquals(new BigDecimal("275.00"),orderRepository.findById(id).orElseThrow().getTotalAmount());
   assertNotNull(orderRepository.findById(id).orElseThrow().getAppliedPromoCode());
   assertEquals(new BigDecimal("275.00"),start(id).getAmount());
   assertEquals(id,orders.createNewOrder(email,req).getOrderId());
   assertEquals(1,promos.findByCodeIgnoreCase(code).orElseThrow().getUsageCount());
 }
 @Test void pendingOrdersDoNotReserveStockAndDuplicateCreationReusesOrder() {
   var req=request(PaymentMethod.CARD);
   var first=orders.createNewOrder(email,req);
   assertEquals(first.getOrderId(),orders.createNewOrder(email,req).getOrderId());
   orders.createNewOrder(email,request(PaymentMethod.CARD));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void rejectsNegativeQuantityAtOrderCreation() {
   var req=request(PaymentMethod.COD); req.getItems().getFirst().setQuantity(-2);
   assertThrows(IllegalArgumentException.class,()->orders.createNewOrder(email,req));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void bankTransferCannotCreateAnOrder() {
   assertThrows(IllegalArgumentException.class,()->orders.createNewOrder(email,request(PaymentMethod.BANK_TRANSFER)));
 }
 @Test void declinedCardCanSwitchToCodOnce() {
   var req=request(PaymentMethod.CARD);
   Long id=orders.createNewOrder(email,req).getOrderId();
   Payment payment=start(id);
   service.processNotification(result(payment,"failed"));
   req.setPaymentMethod(PaymentMethod.COD);
   assertEquals(id,orders.createNewOrder(email,req).getOrderId());
   assertEquals(id,orders.switchToCod(email,id).getOrderId());
   assertEquals(PaymentStatus.DUE_ON_DELIVERY,orderRepository.findById(id).orElseThrow().getPaymentStatus());
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void pendingCardCannotSwitchToCod() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();
   start(id);
   assertThrows(IllegalArgumentException.class,()->orders.switchToCod(email,id));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void codSwitchChecksStockAndOwnership() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();
   Payment payment=start(id);
   service.processNotification(result(payment,"failed"));
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->orders.switchToCod("other@test.com",id));
   orders.createNewOrder(email,request(PaymentMethod.COD));
   assertThrows(OutOfStockException.class,()->orders.switchToCod(email,id));
   assertEquals(PaymentMethod.CARD,orderRepository.findById(id).orElseThrow().getPaymentMethod());
 }
 @Test void lateCardSuccessAfterCodSwitchIsRefunded() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();
   Payment payment=start(id);
   service.processNotification(result(payment,"failed"));
   orders.switchToCod(email,id);
   when(bank.refund("pay_"+payment.getId())).thenReturn(true);
   success(payment);
   assertEquals(PaymentStatus.REFUNDED,payments.findById(payment.getId()).orElseThrow().getStatus());
   assertEquals(PaymentStatus.DUE_ON_DELIVERY,orderRepository.findById(id).orElseThrow().getPaymentStatus());
   assertEquals(PaymentMethod.COD,orderRepository.findById(id).orElseThrow().getPaymentMethod());
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void cardRetryInProgressBlocksCodSwitch() {
   Long id=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();
   Payment payment=start(id);
   service.processNotification(result(payment,"failed"));
   service.initiatePayment(email,InitiatePaymentRequest.builder().orderId(id).paymentMethod(PaymentMethod.CARD).build());
   assertThrows(IllegalArgumentException.class,()->orders.switchToCod(email,id));
 }
 @Test void lateSuccessFromFailedAttemptRefundsWithoutChangingWinningOrder() {
   Long orderId=orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId();
   Payment first=start(orderId);
   service.processNotification(result(first,"failed"));
   service.initiatePayment(email,InitiatePaymentRequest.builder().orderId(orderId).paymentMethod(PaymentMethod.CARD).build());
   Payment second=payments.findByOrderId(orderId).stream().filter(p -> !p.getId().equals(first.getId())).findFirst().orElseThrow();
   success(second);
   when(bank.refund("pay_"+first.getId())).thenReturn(true);
   success(first);
   assertEquals(PaymentStatus.REFUNDED,payments.findById(first.getId()).orElseThrow().getStatus());
   assertEquals(PaymentStatus.SUCCESS,orderRepository.findById(orderId).orElseThrow().getPaymentStatus());
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void concurrentCodOrdersHaveExactlyOneWinner() throws Exception {
   var ready=new CountDownLatch(6); var go=new CountDownLatch(1);
   try(var pool=Executors.newFixedThreadPool(6)) {
     List<Future<Boolean>> results=new ArrayList<>();
     for(int i=0;i<6;i++) {
       String buyer=UUID.randomUUID()+"@test.com";
       users.save(User.builder().email(buyer).password("test-password").build());
       results.add(pool.submit(()->{
       ready.countDown(); go.await();
       try { orders.createNewOrder(buyer,request(PaymentMethod.COD)); return true; }
       catch(OutOfStockException ex) {return false;}
     }));
     }
     assertTrue(ready.await(10,TimeUnit.SECONDS)); go.countDown();
     int winners=0; for(var f:results) if(f.get(30,TimeUnit.SECONDS)) winners++;
     assertEquals(1,winners);
   }
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void losingOnlinePaymentIsRefundedWithoutReleasingWinnersStock() {
   var online=orders.createNewOrder(email,request(PaymentMethod.CARD));
   Payment p=start(online.getOrderId());
   orders.createNewOrder(email,request(PaymentMethod.COD));
   when(bank.refund("pay_"+p.getId())).thenReturn(true);
   success(p);
   assertEquals(PaymentStatus.REFUNDED,payments.findById(p.getId()).orElseThrow().getStatus());
   assertEquals(OrderStatus.STOCK_UNAVAILABLE,orderRepository.findById(online.getOrderId()).orElseThrow().getStatus());
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void duplicateSuccessAllocatesOnce() {
   Payment p=start(orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId());
   success(p); success(p);
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
   assertEquals(PaymentStatus.SUCCESS,payments.findById(p.getId()).orElseThrow().getStatus());
 }
 @Test void failedPaymentDoesNotReleaseUnallocatedStock() {
   Payment p=start(orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId());
   service.processNotification(result(p,"failed")); service.processNotification(result(p,"failed"));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void mismatchedAmountCannotConfirmOrder() {
   Payment p=start(orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId());
   var response=new HashMap<>(result(p,"succeeded")); response.put("payhere_amount","1.00");
   assertThrows(IllegalArgumentException.class,()->service.processNotification(response));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void failedRefundRemainsRecoverable() {
   Payment p=start(orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId());
   orders.createNewOrder(email,request(PaymentMethod.COD));
   when(bank.refund("pay_"+p.getId())).thenThrow(new IllegalStateException("Bank unavailable"));
   success(p);
   success(p);
   verify(bank,times(1)).refund("pay_"+p.getId());
   assertEquals(PaymentStatus.REFUND_PENDING,payments.findById(p.getId()).orElseThrow().getStatus());
   assertTrue(payments.findRecoverableIds().contains(p.getId()));
 }

 @Test void codAndOnlineConfirmationCompeteForOneItem() throws Exception {
   Payment p=start(orders.createNewOrder(email,request(PaymentMethod.CARD)).getOrderId());
   when(bank.refund("pay_"+p.getId())).thenReturn(true);
   var go=new CountDownLatch(1);
   try(var pool=Executors.newFixedThreadPool(2)) {
     var online=pool.submit(()->{go.await(); success(p); return true;});
     var cod=pool.submit(()->{go.await(); try {orders.createNewOrder(email,request(PaymentMethod.COD)); return true;} catch(OutOfStockException ex){return false;}});
     go.countDown(); online.get(30,TimeUnit.SECONDS);
     boolean codWon=cod.get(30,TimeUnit.SECONDS);
     PaymentStatus status=payments.findById(p.getId()).orElseThrow().getStatus();
     assertEquals(codWon ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS,status);
   }
   assertEquals(0,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
 @Test void multiItemConflictDoesNotDeductOtherItems() {
   Product unavailable=products.save(Product.builder().sku(UUID.randomUUID().toString()).name("Sold out")
     .category(product.getCategory()).price(new BigDecimal("100.00")).availableStock(0).build());
   var req=request(PaymentMethod.COD);
   CheckoutItemDto second=new CheckoutItemDto(); second.setProductId(unavailable.getId()); second.setQuantity(1);
   req.setItems(List.of(req.getItems().getFirst(),second));
   assertThrows(OutOfStockException.class,()->orders.createNewOrder(email,req));
   assertEquals(1,products.findById(product.getId()).orElseThrow().getAvailableStock());
 }
}
