package com.icrowd_api.features.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:last-admin;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000")
class AdministratorConcurrencyTest {
    @Autowired UserRepository users;
    @Autowired UserService service;
    @Test void concurrentDeactivationAndDemotionLeaveOneActiveAdministrator() throws Exception {
        var a=users.save(User.builder().email("first-admin@example.test").password("test-only").role("ADMIN").build());
        var b=users.save(User.builder().email("second-admin@example.test").password("test-only").role("ADMIN").build());
        var ready=new CountDownLatch(2);var go=new CountDownLatch(1);
        try(var executor=Executors.newFixedThreadPool(2)) {
            Callable<Boolean> deactivate=() -> {ready.countDown();go.await();try {service.deactivateUser(a.getId(),b.getEmail());return true;} catch(IllegalStateException blocked){return false;}};
            Callable<Boolean> demote=() -> {ready.countDown();go.await();try {service.demoteToUser(b.getId(),a.getEmail());return true;} catch(IllegalStateException blocked){return false;}};
            var first=executor.submit(deactivate);var second=executor.submit(demote);assertTrue(ready.await(5,TimeUnit.SECONDS));go.countDown();
            assertNotEquals(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS));
        }
        assertEquals(1,users.countByRoleAndAccountStatus("ADMIN","ACTIVE"));
    }
}
