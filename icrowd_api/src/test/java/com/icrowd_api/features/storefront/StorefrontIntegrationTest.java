package com.icrowd_api.features.storefront;

import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.promo.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.URI;
import java.net.http.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.io.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:storefront;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class StorefrontIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired JwtUtil jwt;
    @Autowired PromoCodeRepository promos;
    @Autowired PromoCodeUsageRepository promoUsages;
    @Autowired OrderRepository orders;
    @Autowired TransactionTemplate tx;
    @Autowired StorefrontHeroRepository heroes;
    @Autowired com.icrowd_api.features.product.ProductRepository products;
    @Autowired com.icrowd_api.features.category.CategoryRepository categories;
    final HttpClient client = HttpClient.newHttpClient();

    @Test void keywordSearchFindsCategoryProductsWithoutSelectingSuggestion() throws Exception {
        String suffix = UUID.randomUUID().toString();
        var category = categories.save(com.icrowd_api.features.category.Category.builder().name("Headset-" + suffix).build());
        String name = "Wireless audio " + suffix;
        products.save(com.icrowd_api.features.product.Product.builder().sku("A-" + suffix).name(name)
                .category(category).price(BigDecimal.valueOf(50)).availableStock(5).isActive(true).build());
        String hidden = "Hidden audio " + suffix;
        products.save(com.icrowd_api.features.product.Product.builder().sku("B-" + suffix).name(hidden)
                .category(category).price(BigDecimal.valueOf(50)).availableStock(5).isActive(false).build());
        var response = call("GET", "/products?keyword=HEADSET-" + suffix, null, null, null);
        assertEquals(200, response.statusCode(), response.body());
        assertTrue(response.body().contains(name), response.body());
        assertFalse(response.body().contains(hidden), response.body());
        var filtered = call("GET", "/products?keyword=headset-" + suffix + "&maxPrice=10", null, null, null);
        assertEquals(200, filtered.statusCode(), filtered.body());
        assertFalse(filtered.body().contains(name), filtered.body());
    }

    User user(String role) {
        return users.save(User.builder().email(UUID.randomUUID()+"@example.com").password("test").role(role).build());
    }
    String token(User user) {
        return jwt.generateToken(org.springframework.security.core.userdetails.User.withUsername(user.getEmail()).password("unused").roles(user.getRole()).build(), user.getRole());
    }
    HttpResponse<String> call(String method, String path, User user, String type, byte[] body) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path));
        if (user != null) request.header("Authorization", "Bearer "+token(user));
        if (type != null) request.header("Content-Type", type);
        return client.send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofByteArray(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
    byte[] banner(byte[] image) throws Exception {
        var out = new ByteArrayOutputStream();
        out.write(("--test-banner\r\nContent-Disposition: form-data; name=\"headline\"\r\n\r\nNew arrivals\r\n--test-banner\r\nContent-Disposition: form-data; name=\"subtitle\"\r\n\r\nEveryday electronics\r\n--test-banner\r\nContent-Disposition: form-data; name=\"image\"; filename=\"banner.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes());
        out.write(image); out.write("\r\n--test-banner--\r\n".getBytes()); return out.toByteArray();
    }
    @Test void onlyAdminCanSaveBannerAndImageIsPersisted() throws Exception {
        User customer = user("CUSTOMER"), admin = user("ADMIN");
        var bytes = new ByteArrayOutputStream(); ImageIO.write(new BufferedImage(1000, 400, BufferedImage.TYPE_INT_RGB), "png", bytes);
        byte[] body = banner(bytes.toByteArray()); String contentType = "multipart/form-data; boundary=test-banner";
        assertEquals(200, call("GET", "/storefront/hero", null, null, null).statusCode());
        assertEquals(403, call("PUT", "/admin/storefront/hero", customer, contentType, body).statusCode());
        var saved = call("PUT", "/admin/storefront/hero", admin, contentType, body);
        assertEquals(200, saved.statusCode(), saved.body());
        assertTrue(call("GET", "/storefront/hero", null, null, null).body().contains("New arrivals"));
        assertNotNull(heroes.findById(1L).orElseThrow().getImage());
        assertEquals(200, call("GET", "/storefront/hero/image", null, null, null).statusCode());
        assertEquals(400, call("PUT", "/admin/storefront/hero", admin, contentType, banner("<script>bad</script>".getBytes())).statusCode());
    }
    @Test void availablePromosRespectCustomerExpiryMinimumAndUsageWithoutLeakingEmails() throws Exception {
        User buyer = user("CUSTOMER"), other = user("CUSTOMER");
        String prefix = UUID.randomUUID().toString().substring(0, 8);
        tx.executeWithoutResult(status -> {
            promos.save(PromoCode.builder().code(prefix+"SELECT").discountType(DiscountType.FIXED).discountValue(BigDecimal.valueOf(500)).minimumOrderAmount(BigDecimal.valueOf(1000)).customerEligibility(CustomerEligibility.SELECTED_CUSTOMERS).eligibleCustomerEmails(new ArrayList<>(List.of(buyer.getEmail()))).build());
            promos.save(PromoCode.builder().code(prefix+"EXPIRED").discountType(DiscountType.FIXED).discountValue(BigDecimal.TEN).expiryDate(LocalDate.now().minusDays(1)).build());
            var usedPromo = promos.save(PromoCode.builder().code(prefix+"USED").discountType(DiscountType.FIXED).discountValue(BigDecimal.TEN).totalUsageLimit(1).build());
            // Usage limits count persisted redemptions, not the legacy usageCount field.
            var redeemedOrder = orders.save(Order.builder().user(buyer).orderReference(prefix+"-REDEEMED").status(OrderStatus.CONFIRMED).paymentMethod(PaymentMethod.COD).paymentStatus(PaymentStatus.DUE_ON_DELIVERY).deliveryType(DeliveryType.STANDARD).build());
            promoUsages.save(PromoCodeUsage.builder().promoCode(usedPromo).customer(buyer).order(redeemedOrder).build());
        });
        String available = call("GET", "/promo/available?cartSubTotal=2000", buyer, null, null).body();
        assertTrue(available.contains(prefix+"SELECT"));
        assertFalse(available.contains(prefix+"EXPIRED")); assertFalse(available.contains(prefix+"USED")); assertFalse(available.contains(buyer.getEmail()));
        assertFalse(call("GET", "/promo/available?cartSubTotal=2000", other, null, null).body().contains(prefix+"SELECT"));
        assertFalse(call("GET", "/promo/available?cartSubTotal=500", buyer, null, null).body().contains(prefix+"SELECT"));
        assertTrue(call("GET", "/promo/available?cartSubTotal=2000", null, null, null).statusCode() >= 400);
    }
    @Test void orderHistoryContainsOnlyTheSignedInCustomersOrders() throws Exception {
        User buyer = user("CUSTOMER"), other = user("CUSTOMER");
        String reference = "HISTORY-"+UUID.randomUUID();
        orders.save(Order.builder().user(buyer).orderReference(reference).status(OrderStatus.CONFIRMED).paymentMethod(PaymentMethod.COD).paymentStatus(PaymentStatus.DUE_ON_DELIVERY).deliveryType(DeliveryType.STANDARD).build());
        String mine = call("GET", "/orders", buyer, null, null).body();
        assertTrue(mine.contains(reference)); assertFalse(mine.contains("password")); assertFalse(mine.contains("checkoutKey"));
        assertFalse(call("GET", "/orders", other, null, null).body().contains(reference));
        assertTrue(call("GET", "/orders", null, null, null).statusCode() >= 400);
    }

    @Test void shippingQuoteRecalculatesPromoAgainstServerPrices() throws Exception {
        User buyer = user("CUSTOMER");
        String code = "QUOTE-"+UUID.randomUUID().toString().substring(0, 8);
        var category = new com.icrowd_api.features.category.Category(); category.setName(code); categories.save(category);
        var product = products.save(com.icrowd_api.features.product.Product.builder().sku(code).name("Quote product").category(category).price(BigDecimal.valueOf(1000)).availableStock(10).build());
        promos.save(PromoCode.builder().code(code).discountType(DiscountType.FIXED).discountValue(BigDecimal.valueOf(100)).build());
        String body = "{\"recipientName\":\"Test Buyer\",\"phone\":\"0712345678\",\"email\":\""+buyer.getEmail()+"\",\"address\":\"42 Temple Road\",\"district\":\"Colombo\",\"latitude\":6.9271,\"longitude\":79.8612,\"deliveryType\":\"STANDARD\",\"promoCode\":\""+code+"\",\"items\":[{\"productId\":"+product.getId()+",\"quantity\":1}]}";
        var quote = call("POST", "/orders/validate-shipping", buyer, "application/json", body.getBytes());
        assertEquals(200, quote.statusCode(), quote.body());
        assertTrue(quote.body().contains("\"totalAmount\":1100"), quote.body());
        promos.findByCodeIgnoreCase(code).ifPresent(promo -> { promo.setActive(false); promos.save(promo); });
        assertEquals(400, call("POST", "/orders/validate-shipping", buyer, "application/json", body.getBytes()).statusCode());
    }
}
