package com.icrowd_api.features.auth;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.category.*;
import com.icrowd_api.features.assistant.AiChatService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import jakarta.persistence.EntityManagerFactory;
import java.net.*;
import java.net.http.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
 "spring.datasource.url=jdbc:h2:mem:security-regressions;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
 "spring.jpa.properties.hibernate.default_batch_fetch_size=64","spring.jpa.properties.hibernate.generate_statistics=true"})
class SecurityRegressionIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired JwtUtil jwt;
    @Autowired AiChatService chat;
    @Autowired EntityManagerFactory emf;
    final HttpClient client=HttpClient.newHttpClient();
    HttpResponse<String> call(String method,String path,String body,String token) throws Exception {
        var r=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path)).header("Content-Type","application/json");
        if(token!=null)r.header("Authorization","Bearer "+token);
        return client.send(r.method(method,body==null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    User user(String role) {return users.save(User.builder().email(UUID.randomUUID()+"@example.com").password("test-only-password").role(role).build());}
    String token(User u) {return jwt.generateToken(org.springframework.security.core.userdetails.User.withUsername(u.getEmail()).password("unused").roles(u.getRole()).build(),u.getRole(),u.getTokenVersion());}
    Product product(String suffix) {
        var category=categories.save(Category.builder().name("Headset "+suffix).build());
        return products.save(Product.builder().sku(suffix).name("Private cost headset "+suffix).category(category).price(BigDecimal.valueOf(100)).costPrice(BigDecimal.valueOf(73.91)).availableStock(8).imageUrls(List.of("https://example.com/image.png")).tags(List.of("audio")).features(List.of("music")).specifications(Map.of("type","headset")).build());
    }
    @Test void rejectsSignedTokensWithoutVersionAndRevokedVersions() throws Exception {
        var u=user("CUSTOMER");String secret="isolated-test-signing-key-not-for-deployment-2026";
        String legacy=io.jsonwebtoken.Jwts.builder().setSubject(u.getEmail()).setExpiration(new Date(System.currentTimeMillis()+60000))
            .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8))).compact();
        assertEquals(401,call("GET","/auth/me",null,legacy).statusCode());
        String old=token(u);u.setTokenVersion(2L);users.save(u);assertEquals(401,call("GET","/auth/me",null,old).statusCode());
        assertEquals(200,call("GET","/auth/me",null,token(u)).statusCode());
    }
    @Test void publicCatalogHidesCostsAndBoundsDatabaseWork() throws Exception {
        String suffix=UUID.randomUUID().toString();var first=product(suffix);
        for(int i=0;i<9;i++)products.save(Product.builder().sku(suffix+i).name("Private cost headset "+suffix+i).category(first.getCategory()).price(BigDecimal.TEN).costPrice(BigDecimal.ONE).availableStock(10).imageUrls(List.of("https://example.com/"+i+".png")).build());
        var stats=emf.unwrap(org.hibernate.SessionFactory.class).getStatistics();stats.clear();
        var r=call("GET","/products?keyword="+suffix+"&size=10",null,null);assertEquals(200,r.statusCode(),r.body());
        assertFalse(r.body().contains("costPrice"));assertFalse(r.body().contains("effectiveCostPrice"));
        assertTrue(stats.getPrepareStatementCount()<=6,"Catalog query count: "+stats.getPrepareStatementCount());
        var detail=call("GET","/products/"+first.getId(),null,null);assertFalse(detail.body().contains("costPrice"));
        var admin=call("GET","/products/admin/"+first.getId(),null,token(user("ADMIN")));assertEquals(200,admin.statusCode(),admin.body());assertTrue(admin.body().contains("73.91"));
        assertEquals(200,call("GET","/products/latest?limit=2147483647",null,null).statusCode());
    }
    @Test void chatSurvivesSeparateRequestsAfterPolicyAnswer() throws Exception {
        product(UUID.randomUUID().toString());chat.refreshProductCache();String session=UUID.randomUUID().toString();
        for(String message:List.of("delivery","headsets","powerbanks")) {
            var r=call("POST","/ai/chat","{\"sessionId\":\""+session+"\",\"message\":\""+message+"\"}",null);
            assertEquals(200,r.statusCode(),r.body());assertFalse(r.body().contains("costPrice"));assertTrue(r.body().contains("reply"));
        }
    }
    @Test void inventoryStaffCanReachInventoryButNotAccountsOrAnalytics() throws Exception {
        String staff=token(user("INVENTORY_MANAGER"));
        var dashboard=call("GET","/admin/dashboard",null,staff);
        assertEquals(200,dashboard.statusCode());
        assertFalse(dashboard.body().contains("recentOrders"));
        assertFalse(dashboard.body().contains("totalRevenue"));
        assertEquals(403,call("GET","/admin/orders",null,staff).statusCode());
        assertEquals(403,call("PATCH","/admin/orders/1/status","{\"status\":\"SHIPPED\"}",staff).statusCode());
        assertEquals(200,call("GET","/products/admin/all",null,staff).statusCode());
        assertEquals(403,call("GET","/admin/users",null,staff).statusCode());
        assertEquals(403,call("GET","/analytics/summary",null,staff).statusCode());
    }
    @Test void administratorOrderListingIsBoundedAndUsesConfiguredCors() throws Exception {
        String admin=token(user("ADMIN"));
        var list=call("GET","/admin/orders?size=2147483647&page=-1",null,admin);
        assertEquals(200,list.statusCode(),list.body());
        assertTrue(list.body().contains("\"size\":100"),list.body());
        assertEquals(404,call("GET","/admin/orders/9223372036854775807",null,admin).statusCode());
        assertEquals(401,call("GET","/admin/orders",null,null).statusCode());
        var preflight=client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/admin/orders"))
            .header("Origin","https://untrusted.example").header("Access-Control-Request-Method","GET")
            .method("OPTIONS",HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString());
        assertEquals(403,preflight.statusCode());
        var dashboard=call("GET","/admin/dashboard",null,admin);
        assertEquals(200,dashboard.statusCode(),dashboard.body());
        assertTrue(dashboard.body().contains("recentOrders"));
    }
    @Test void legacyCheckoutAndPublicUploadsAreClosed() throws Exception {
        assertEquals(410,call("POST","/orders/checkout","{}",token(user("CUSTOMER"))).statusCode());
        var r=client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/uploads/receipt.pdf")).GET().build(),HttpResponse.BodyHandlers.ofString());
        assertTrue(r.statusCode()==401 || r.statusCode()==403);
    }
    @Test void staleOrMissingProductVersionsCannotOverwriteNewStock() throws Exception {
        var p=product(UUID.randomUUID().toString());String admin=token(user("ADMIN"));
        assertEquals(200,call("PUT","/products/"+p.getId(),"{\"version\":0,\"availableStock\":4,\"costPrice\":70,\"leadTimeDays\":9}",admin).statusCode());
        assertEquals(409,call("PUT","/products/"+p.getId(),"{\"version\":0,\"availableStock\":8}",admin).statusCode());
        assertEquals(409,call("PUT","/products/"+p.getId(),"{\"availableStock\":8}",admin).statusCode());
        assertEquals(4,products.findById(p.getId()).orElseThrow().getAvailableStock());
        assertEquals(9,products.findById(p.getId()).orElseThrow().getLeadTimeDays());
    }
    @Test void normalizedEmailsCannotCreateCaseVariantAccounts() {
        String mixed="Case"+UUID.randomUUID()+"@Example.COM";var u=users.save(User.builder().email(mixed).password("unused").build());
        assertEquals(mixed.toLowerCase(Locale.ROOT),u.getEmail());assertTrue(users.existsByEmailIgnoreCase(mixed));
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,() -> users.saveAndFlush(User.builder().email(mixed.toUpperCase(Locale.ROOT)).password("unused").build()));
    }
}
