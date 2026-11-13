package com.icrowd_api.features.marketing;
import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.promo.*;
import com.icrowd_api.features.order.*;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test; import org.junit.jupiter.api.BeforeEach; import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:marketing;DB_CLOSE_DELAY=-1;MODE=PostgreSQL", "spring.jpa.hibernate.ddl-auto=create-drop", "app.marketing.interval-ms=3600000"})
class MarketingIntegrationTest {
    @Autowired MarketingService service;
    @Autowired MarketingWorker worker;
    @Autowired MarketingProperties config;
    @Autowired CampaignRecorder recorder;
    @Autowired EmailPreferenceRepository preferences;
    @Autowired EmailCampaignRepository campaigns;
    @Autowired EmailDeliveryRepository deliveries;
    @Autowired EmailAttemptRepository attempts;
    @Autowired UserRepository users;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired PromoCodeRepository promos;
    @Autowired OrderRepository orders;
    @Autowired TransactionTemplate tx;
    @MockitoBean JavaMailSender mail;
    User user; Product product; Long campaignId;
    @BeforeEach void setup() {
        config.setEnabled(false); config.setDailyLimit(100); config.setWeeklyCustomerLimit(2);
        config.setFrom("sender@example.com"); config.setFrontendUrl("https://shop.example.com"); config.setPublicApiUrl("https://api.example.com");
        deliveries.deleteAll(); attempts.deleteAll(); preferences.deleteAll(); campaigns.deleteAll();
        String suffix=UUID.randomUUID().toString();
        user=users.save(User.builder().email(suffix+"@example.com").password("test-password").build());
        Category category=categories.save(Category.builder().name("Audio "+suffix).build());
        product=products.save(Product.builder().sku(suffix).name("Office headphones").category(category).price(BigDecimal.valueOf(5000)).availableStock(10).tags(List.of("office")).brand("Sony").build());
        service.savePreference(user.getEmail(),new MarketingService.PreferenceView(true,"office","Sony"));
        recorder.record("PRODUCT",product.getId()); campaignId=campaigns.findTop30ByOrderByIdDesc().get(0).getId();
        when(mail.createMimeMessage()).thenAnswer(inv -> new MimeMessage((Session)null));
    }
    @AfterEach void disable() { config.setEnabled(false); }
    @Test void optInMatchingAndDeduplication() {
        recorder.record("PRODUCT",product.getId());
        assertEquals(1,campaigns.count());
        assertEquals(1,service.audience(campaignId).size());
        worker.tick(); worker.tick();
        assertEquals(1,deliveries.count());
        verify(mail,never()).send(any(MimeMessage.class));
    }
    @Test void unsubscribeSuppressesQueuedEmail() {
        worker.tick();
        String token=preferences.findById(user.getId()).orElseThrow().getUnsubscribeToken();
        service.unsubscribe(token); config.setEnabled(true); worker.tick();
        assertEquals("SKIPPED",deliveries.findAll().get(0).getStatus());
        verify(mail,never()).send(any(MimeMessage.class));
    }
    @Test void sendsOnlyOnceAndIncludesProductAndUnsubscribeLinks() throws Exception {
        config.setEnabled(true); worker.tick(); worker.tick();
        var captor=org.mockito.ArgumentCaptor.forClass(MimeMessage.class);
        verify(mail,times(1)).send(captor.capture());
        assertEquals("SENT",deliveries.findAll().get(0).getStatus());
        assertNotNull(captor.getValue().getHeader("List-Unsubscribe"));
        java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream(); captor.getValue().writeTo(bytes);
        assertTrue(bytes.toString(java.nio.charset.StandardCharsets.UTF_8).contains("/product/"+product.getId()));
        assertEquals(1,attempts.count());
    }
    @Test void unavailableProductIsSuppressedBeforeSend() {
        worker.tick(); product.setAvailableStock(0); products.save(product); config.setEnabled(true); worker.tick();
        assertEquals("SKIPPED",deliveries.findAll().get(0).getStatus()); verify(mail,never()).send(any(MimeMessage.class));
    }
    @Test void rollingLimitsLeaveEmailsQueued() {
        config.setEnabled(true); config.setDailyLimit(0); worker.tick();
        assertEquals("QUEUED",deliveries.findAll().get(0).getStatus()); verify(mail,never()).send(any(MimeMessage.class));
        config.setDailyLimit(100); config.setWeeklyCustomerLimit(0); worker.tick();
        assertEquals("QUEUED",deliveries.findAll().get(0).getStatus()); verify(mail,never()).send(any(MimeMessage.class));
    }
    @Test void brandAloneDoesNotQualify() {
        service.savePreference(user.getEmail(),new MarketingService.PreferenceView(true,"","Sony"));
        assertTrue(service.audience(campaignId).isEmpty());
    }
    @Test void purchasedItemAndFailedOrdersAreHandled() {
        service.savePreference(user.getEmail(),new MarketingService.PreferenceView(true,"",""));
        Order order=Order.builder().user(user).status(OrderStatus.FAILED).deliveryType(DeliveryType.values()[0]).paymentMethod(PaymentMethod.values()[0]).paymentStatus(PaymentStatus.values()[0]).build();
        order.getItems().add(OrderItem.builder().order(order).product(product).quantity(1).priceAtTimeOfPurchase(product.getPrice()).build()); orders.save(order);
        assertTrue(service.audience(campaignId).isEmpty());
        service.savePreference(user.getEmail(),new MarketingService.PreferenceView(true,"office",""));
        assertEquals(1,service.audience(campaignId).size());
        tx.executeWithoutResult(status -> orders.findById(order.getId()).orElseThrow().setStatus(OrderStatus.COMPLETED));
        assertTrue(service.audience(campaignId).isEmpty());
    }
    @Test void selectedCustomerPromotionDoesNotLeakToOthers() {
        PromoCode promo=promos.save(PromoCode.builder().code(UUID.randomUUID().toString()).discountType(DiscountType.PERCENTAGE).discountValue(BigDecimal.TEN)
            .customerEligibility(CustomerEligibility.SELECTED_CUSTOMERS).eligibleCustomerEmails(List.of("someoneelse@example.com")).build());
        recorder.record("PROMO",promo.getId());
        Long id=campaigns.findTop30ByOrderByIdDesc().get(0).getId();
        assertTrue(service.audience(id).isEmpty());
    }
    @Test void ambiguousDeliveryFailureIsNotRetried() {
        doThrow(new org.springframework.mail.MailSendException("Unknown delivery outcome")).when(mail).send(any(MimeMessage.class));
        config.setEnabled(true); worker.tick(); worker.tick();
        assertEquals("FAILED",deliveries.findAll().get(0).getStatus()); verify(mail,times(1)).send(any(MimeMessage.class));
    }
}

