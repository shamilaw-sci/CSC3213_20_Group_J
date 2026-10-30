package com.icrowd_api.features.order;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class PayHereClientTest {
    PayHereClient client() {
        var client=new PayHereClient();
        ReflectionTestUtils.setField(client,"merchantId","merchant");
        ReflectionTestUtils.setField(client,"merchantSecret","secret");
        ReflectionTestUtils.setField(client,"notifyUrl","https://example.com/api/payments/notify");
        return client;
    }
    Map<String,String> notification() {
        var values=new HashMap<>(Map.of("merchant_id","merchant","order_id","order","payment_id","123",
            "payhere_amount","100.00","payhere_currency","LKR","status_code","2"));
        values.put("md5sig",PayHereClient.md5("merchantorder100.00LKR2"+PayHereClient.md5("secret")));
        return values;
    }
    @Test void acceptsValidSignature() { assertDoesNotThrow(()->client().verify(notification())); }
    @Test void rejectsTamperedAmount() {
        var values=notification(); values.put("payhere_amount","1.00");
        assertThrows(IllegalArgumentException.class,()->client().verify(values));
    }
    @Test void rejectsForgedSignature() {
        var values=notification(); values.put("md5sig","invalid");
        assertThrows(IllegalArgumentException.class,()->client().verify(values));
    }
    @Test void rejectsMissingFields() {
        var values=notification(); values.remove("payment_id");
        assertThrows(IllegalArgumentException.class,()->client().verify(values));
    }
}
