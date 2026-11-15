package com.icrowd_api.features.marketing;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.order.*;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;
@Component
public class AudienceMatcher {
    public record Match(int score, String reason) {}
    private static final Set<OrderStatus> SUCCESS = Set.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED);
    public Match match(Product product, EmailPreference preference, List<Order> orders) {
        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailableStock() == null || product.getAvailableStock() <= 0) return new Match(0, "Unavailable");
        return match(product,preference,affinity(orders));
    }
    public record Affinity(Set<Long> purchased,Map<Long,Integer> categories,Map<String,Integer> brands) {}
    public Affinity affinity(List<Order> orders) {
        List<Object[]> rows=new ArrayList<>();
        for (Order order : orders) if (SUCCESS.contains(order.getStatus()) && com.icrowd_api.features.analytics.AnalyticsService.QUALIFYING_PAYMENT_STATUSES.contains(order.getPaymentStatus()))
            for (OrderItem item : order.getItems()) { var p=item.getProduct(); rows.add(new Object[]{p.getId(),p.getCategory().getId(),p.getBrand(),order.getCreatedAt()}); }
        return fromRows(rows);
    }
    public Affinity fromRows(List<Object[]> rows) {
        Set<Long> purchased=new HashSet<>(); Map<Long,Integer> categories=new HashMap<>(); Map<String,Integer> brands=new HashMap<>();
        for (var row : rows) {
            purchased.add((Long)row[0]); boolean recent=row[3]!=null && ((LocalDateTime)row[3]).isAfter(LocalDateTime.now().minusDays(180));
            categories.merge((Long)row[1],recent ? 30 : 20,Math::max);
            brands.merge(normalize((String)row[2]),recent ? 10 : 5,Math::max);
        }
        return new Affinity(purchased,categories,brands);
    }
    public Match match(Product product, EmailPreference preference, Affinity affinity) {
        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailableStock()==null || product.getAvailableStock()<=0) return new Match(0,"Unavailable");
        if (affinity.purchased().contains(product.getId())) return new Match(0,"Already purchased");
        int category=affinity.categories().getOrDefault(product.getCategory().getId(),0);
        int brand=affinity.brands().getOrDefault(normalize(product.getBrand()),0);
        Set<String> terms = new HashSet<>();
        terms.add(normalize(product.getCategory().getName()));
        if (product.getTags() != null) product.getTags().forEach(t -> terms.add(normalize(t)));
        boolean interest = split(preference.getInterests()).stream().anyMatch(terms::contains);
        boolean chosenBrand = split(preference.getBrands()).contains(normalize(product.getBrand()));
        int score = category + brand + (interest ? 30 : 0) + (chosenBrand ? 10 : 0);
        if (category == 0 && !interest) return new Match(0, "No category or interest match");
        return new Match(score, interest ? "Matches your selected interests" : "Related to your successful purchases");
    }
    private boolean same(String a, String b) { return !normalize(a).isEmpty() && normalize(a).equals(normalize(b)); }
    private String normalize(String s) { return s == null ? "" : s.trim().toLowerCase(Locale.ROOT); }
    private Set<String> split(String value) {
        Set<String> result = new HashSet<>();
        for (String s : (value == null ? "" : value).split(",")) if (!s.isBlank()) result.add(normalize(s));
        return result;
    }
}
