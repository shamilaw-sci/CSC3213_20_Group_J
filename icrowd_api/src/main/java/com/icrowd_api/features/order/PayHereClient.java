package com.icrowd_api.features.order;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Component
public class PayHereClient {
    @Value("${payhere.merchant-id:}") private String merchantId;
    @Value("${payhere.merchant-secret:}") private String merchantSecret;
    @Value("${payhere.sandbox:true}") private boolean sandbox;
    @Value("${payhere.app-id:}") private String appId;
    @Value("${payhere.app-secret:}") private String appSecret;
    @Value("${payhere.notify-url:}") private String notifyUrl;
    public String checkoutUrl() { return baseUrl()+"/pay/checkout"; }
    private String baseUrl() { return sandbox ? "https://sandbox.payhere.lk" : "https://www.payhere.lk"; }
    public void requireConfigured() {
        if (merchantId.isBlank() || merchantSecret.isBlank() || !notifyUrl.startsWith("https://"))
            throw new IllegalStateException("PayHere requires merchant credentials and a public HTTPS notification URL.");
    }
    public Map<String,String> checkout(Payment payment, Order order, String frontend) {
        requireConfigured();
        Map<String,String> fields=new LinkedHashMap<>();
        String amount=payment.getAmount().setScale(2).toPlainString();
        fields.put("merchant_id",merchantId); fields.put("order_id",payment.getInternalPaymentId());
        fields.put("amount",amount); fields.put("currency",payment.getCurrency());
        fields.put("hash",md5(merchantId+payment.getInternalPaymentId()+amount+payment.getCurrency()+md5(merchantSecret)));
        fields.put("return_url",frontend+"/checkout/success?orderId="+order.getId());
        fields.put("cancel_url",frontend+"/checkout/success?orderId="+order.getId());
        fields.put("notify_url",notifyUrl); fields.put("items","Order "+order.getOrderReference());
        String[] names=order.getShippingFullName().trim().split("\\s+",2);
        fields.put("first_name",names[0]); fields.put("last_name",names.length>1?names[1]:names[0]);
        fields.put("email",order.getShippingEmail()); fields.put("phone",order.getShippingPhone());
        fields.put("address",order.getShippingAddress()); fields.put("city",order.getShippingDistrict());
        fields.put("country","Sri Lanka");
        return fields;
    }
    public void verify(Map<String,String> values) {
        requireConfigured();
        for(String key:List.of("merchant_id","order_id","payment_id","payhere_amount","payhere_currency","status_code","md5sig"))
            if(values.get(key)==null || values.get(key).isBlank()) throw new IllegalArgumentException("Missing notification field");
        String expected=md5(values.get("merchant_id")+values.get("order_id")+values.get("payhere_amount")
            +values.get("payhere_currency")+values.get("status_code")+md5(merchantSecret));
        if(!merchantId.equals(values.get("merchant_id")) || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),
            values.get("md5sig").toUpperCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII)))
            throw new IllegalArgumentException("Invalid payment signature");
    }
    static String md5(String value) {
        try { return HexFormat.of().withUpperCase().formatHex(MessageDigest.getInstance("MD5").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch(Exception ex) { throw new IllegalStateException(ex); }
    }
    public boolean refundsConfigured() { return !appId.isBlank() && !appSecret.isBlank(); }
    public boolean refund(String paymentId) {
        var factory=new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); factory.setReadTimeout(15000);
        RestClient client=RestClient.builder().baseUrl(baseUrl()).requestFactory(factory).build();
        Map<?,?> token=client.post().uri("/merchant/v1/oauth/token")
            .headers(h -> h.setBasicAuth(appId,appSecret)).contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body("grant_type=client_credentials").retrieve().body(Map.class);
        if(token==null || token.get("access_token")==null) throw new IllegalStateException("Refund authentication failed");
        Map<?,?> result=client.post().uri("/merchant/v1/payment/refund")
            .headers(h -> h.setBearerAuth(token.get("access_token").toString())).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("payment_id",paymentId,"description","Order cannot be fulfilled")).retrieve().body(Map.class);
        return result!=null && "1".equals(String.valueOf(result.get("status")));
    }
}
