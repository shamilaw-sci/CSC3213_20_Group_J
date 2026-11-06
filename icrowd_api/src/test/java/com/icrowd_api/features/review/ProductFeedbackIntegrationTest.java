package com.icrowd_api.features.review;

import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.order.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.URI;
import java.net.http.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={"spring.datasource.url=jdbc:h2:mem:feedback;DB_CLOSE_DELAY=-1;MODE=PostgreSQL", "spring.jpa.hibernate.ddl-auto=create-drop"})
class ProductFeedbackIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired OrderRepository orders;
    @Autowired JwtUtil jwt;
    @Autowired TransactionTemplate tx;
    @Autowired ReviewRepository reviews;
    Long first, second;
    String buyer, other, staff;
    final HttpClient client=HttpClient.newHttpClient();
    @BeforeEach void setup() {
        tx.executeWithoutResult(status -> {
            String suffix=UUID.randomUUID().toString();
            User a=users.save(User.builder().email("a"+suffix+"@example.com").password("test-password").build());
            User b=users.save(User.builder().email("b"+suffix+"@example.com").password("test-password").build());
            User admin=users.save(User.builder().email("staff"+suffix+"@example.com").password("test-password").role("ADMIN").build());
            Category category=new Category();category.setName("Feedback "+suffix); categories.save(category);
            Product p=products.save(Product.builder().sku("a"+suffix).name("First product").category(category).price(BigDecimal.TEN).availableStock(10).build());
            Product q=products.save(Product.builder().sku("b"+suffix).name("Second product").category(category).price(BigDecimal.TEN).availableStock(10).build());
            first=p.getId();second=q.getId();
            for(User u:List.of(a,b)) {
                Order order=Order.builder().user(u).status(OrderStatus.COMPLETED).deliveryType(DeliveryType.values()[0]).paymentMethod(PaymentMethod.values()[0]).paymentStatus(PaymentStatus.values()[0]).build();
                order.getItems().add(OrderItem.builder().order(order).product(p).quantity(1).priceAtTimeOfPurchase(BigDecimal.TEN).build()); orders.save(order);
            }
            buyer=token(a);other=token(b);staff=token(admin);
        });
    }
    String token(User u) { return jwt.generateToken(org.springframework.security.core.userdetails.User.withUsername(u.getEmail()).password("unused").roles(u.getRole()).build(),u.getRole()); }
    HttpResponse<String> call(String method,String path,String token,String body) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path)).header("Content-Type","application/json");
        if(token!=null)builder.header("Authorization","Bearer "+token);
        return client.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    String path(Long id) { return "/products/"+id+"/reviews"; }
    long id(String body) { return Long.parseLong(java.util.regex.Pattern.compile("\"id\":([0-9]+)").matcher(body).results().findFirst().orElseThrow().group(1)); }
    @Test void reviewLifecycleAndIsolation() throws Exception {
        assertEquals(200,call("GET",path(first),null,null).statusCode());
        assertTrue(call("POST",path(first),null,"{\"rating\":5,\"comment\":\"Great product\"}").statusCode()>=400);
        var created=call("POST",path(first),buyer,"{\"rating\":5,\"comment\":\"Great product\"}");assertEquals(200,created.statusCode(),created.body());long id=id(created.body());
        assertEquals(409,call("POST",path(first),buyer,"{\"rating\":5,\"comment\":\"Duplicate review\"}").statusCode());
        assertEquals(403,call("POST",path(second),buyer,"{\"rating\":5,\"comment\":\"Not purchased\"}").statusCode());
        assertFalse(call("GET",path(second),null,null).body().contains("Great product"));
        assertEquals(200,call("POST",path(first),other,"{\"rating\":2,\"comment\":\"Other opinion\"}").statusCode());
        assertEquals(3.5,products.findById(first).orElseThrow().getAverageRating());
        String mine=call("GET","/users/me/reviews",buyer,null).body();
        assertTrue(mine.contains("Great product")); assertFalse(mine.contains("Other opinion"));
        assertEquals("[]",call("GET","/users/me/reviews/pending",buyer,null).body());
        assertEquals(403,call("PUT",path(first)+"/"+id,other,"{\"rating\":1,\"comment\":\"Wrong owner\"}").statusCode());
        assertEquals(404,call("DELETE",path(second)+"/"+id,staff,null).statusCode());
        assertEquals(200,call("PUT",path(first)+"/"+id,buyer,"{\"rating\":4,\"comment\":\"Updated opinion\"}").statusCode());
        assertEquals(3.0,products.findById(first).orElseThrow().getAverageRating());
        assertEquals(204,call("DELETE",path(first)+"/"+id,staff,null).statusCode());
        assertEquals(1,products.findById(first).orElseThrow().getReviewCount());
        assertEquals(2.0,products.findById(first).orElseThrow().getAverageRating());
        assertEquals(200,call("GET","/users/me/reviews/pending",buyer,null).statusCode());
    }
    @Test void rejectsInvalidReviewsAndPagination() throws Exception {
        for(String json:List.of("{\"comment\":\"Missing rating\"}","{\"rating\":6,\"comment\":\"Too many stars\"}","{\"rating\":3,\"comment\":\"     \"}","{\"rating\":3,\"comment\":\""+"x".repeat(1001)+"\"}")) assertEquals(400,call("POST",path(first),buyer,json).statusCode());
        assertEquals(400,call("GET",path(first)+"?size=1000",null,null).statusCode());
        assertEquals(400,call("GET",path(first)+"?page=-1",null,null).statusCode());
        assertEquals(0,reviews.countByProduct_Id(first));
    }
    @Test void questionsAreProductSpecificAndAnswersRequireStaff() throws Exception {
        String path="/products/"+first+"/questions";
        assertEquals(200,call("GET",path,null,null).statusCode());
        var created=call("POST",path,buyer,"{\"text\":\"Does this support USB?\"}");assertEquals(200,created.statusCode(),created.body());long id=id(created.body());
        assertFalse(call("GET","/products/"+second+"/questions",null,null).body().contains("Does this support USB?"));
        assertEquals(403,call("PUT",path+"/"+id+"/answer",other,"{\"text\":\"Unofficial answer\"}").statusCode());
        assertEquals(404,call("PUT","/products/"+second+"/questions/"+id+"/answer",staff,"{\"text\":\"Wrong product\"}").statusCode());
        assertEquals(200,call("PUT",path+"/"+id+"/answer",staff,"{\"text\":\"Yes, USB is supported.\"}").statusCode());
        assertTrue(call("GET",path,null,null).body().contains("Yes, USB is supported."));
        assertEquals(403,call("DELETE",path+"/"+id,other,null).statusCode());
        assertEquals(204,call("DELETE",path+"/"+id,buyer,null).statusCode());
    }
    @Test void simultaneousReviewsKeepAccurateTotals() throws Exception {
        try (var pool=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var ready=new java.util.concurrent.CountDownLatch(2);
            var start=new java.util.concurrent.CountDownLatch(1);
            var a=pool.submit(() -> { ready.countDown(); start.await(); return call("POST",path(first),buyer,"{\"rating\":5,\"comment\":\"First concurrent review\"}"); });
            var b=pool.submit(() -> { ready.countDown(); start.await(); return call("POST",path(first),other,"{\"rating\":2,\"comment\":\"Second concurrent review\"}"); });
            assertTrue(ready.await(10,java.util.concurrent.TimeUnit.SECONDS));start.countDown();
            assertEquals(200,a.get(20,java.util.concurrent.TimeUnit.SECONDS).statusCode());
            assertEquals(200,b.get(20,java.util.concurrent.TimeUnit.SECONDS).statusCode());
        }
        Product product=products.findById(first).orElseThrow();
        assertEquals(2,product.getReviewCount());assertEquals(3.5,product.getAverageRating());
    }
    @Test void eligibilityMatchesExistingCheckoutStatuses() throws Exception {
        for (OrderStatus state : List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.FAILED, OrderStatus.CANCELLED, OrderStatus.STOCK_UNAVAILABLE, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.COMPLETED)) {
            tx.executeWithoutResult(status -> orders.findAll().stream()
                .filter(o -> o.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(first)))
                .forEach(o -> o.setStatus(state)));
            boolean eligible=List.of(OrderStatus.CONFIRMED,OrderStatus.PROCESSING,OrderStatus.COMPLETED).contains(state);
            var result=call("POST",path(first),buyer,"{\"rating\":4,\"comment\":\"Purchased product review\"}");
            assertEquals(eligible ? 200 : 403,result.statusCode(),state+": "+result.body());
            if (eligible) assertEquals(204,call("DELETE",path(first)+"/"+id(result.body()),buyer,null).statusCode());
        }
    }
}


