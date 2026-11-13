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
        int category = 0, brand = 0;
        for (Order order : orders) {
            if (!SUCCESS.contains(order.getStatus())) continue;
            for (OrderItem item : order.getItems()) {
                Product owned = item.getProduct();
                if (Objects.equals(owned.getId(), product.getId())) return new Match(0, "Already purchased");
                boolean recent = order.getCreatedAt() != null && order.getCreatedAt().isAfter(LocalDateTime.now().minusDays(180));
                if (Objects.equals(owned.getCategory().getId(), product.getCategory().getId())) category = Math.max(category, recent ? 30 : 20);
                if (same(owned.getBrand(), product.getBrand())) brand = Math.max(brand, recent ? 10 : 5);
            }
        }
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
