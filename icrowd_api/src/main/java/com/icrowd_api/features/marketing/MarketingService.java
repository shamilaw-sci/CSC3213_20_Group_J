package com.icrowd_api.features.marketing;

import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.promo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class MarketingService {
    private final EmailPreferenceRepository preferences;
    private final EmailCampaignRepository campaigns;
    private final EmailDeliveryRepository deliveries;
    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final PromoCodeRepository promos;
    private final PromoCodeService promoService;
    private final AudienceMatcher matcher;
    private final MarketingProperties config;

    public record PreferenceView(boolean subscribed, String interests, String brands) {}
    public record Candidate(Long userId, String email, Long productId, String productName, int score, String reason) {}
    private User user(String email) { return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    @Transactional(readOnly=true)
    public PreferenceView preference(String email) {
        return preferences.findById(user(email).getId()).map(p -> new PreferenceView(p.isSubscribed(), p.getInterests(), p.getBrands()))
                .orElse(new PreferenceView(false, "", ""));
    }
    @Transactional
    public PreferenceView savePreference(String email, PreferenceView input) {
        User u = user(email);
        if (!"CUSTOMER".equals(u.getRole())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        EmailPreference p = preferences.findById(u.getId()).orElseGet(() -> {
            EmailPreference created = new EmailPreference(); created.setUserId(u.getId());
            created.setUnsubscribeToken(UUID.randomUUID().toString() + UUID.randomUUID()); return created;
        });
        if (input.subscribed() && !p.isSubscribed()) p.setConsentAt(Instant.now());
        p.setSubscribed(input.subscribed()); p.setInterests(clean(input.interests())); p.setBrands(clean(input.brands()));
        p.setUpdatedAt(Instant.now()); preferences.save(p);
        return new PreferenceView(p.isSubscribed(), p.getInterests(), p.getBrands());
    }
    private String clean(String value) {
        if (value == null) return "";
        if (value.length() > 500) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferences must be at most 500 characters");
        return value.trim();
    }
    @Transactional
    public void unsubscribe(String token) {
        preferences.findByUnsubscribeToken(token).ifPresent(p -> { p.setSubscribed(false); p.setUpdatedAt(Instant.now()); });
    }
    public boolean activeCustomer(User user, EmailPreference preference) {
        return user != null && preference != null && preference.isSubscribed() && "CUSTOMER".equals(user.getRole()) && "ACTIVE".equals(user.getAccountStatus());
    }
    public boolean validPromo(EmailCampaign campaign, User user) {
        return !"PROMO".equals(campaign.getKind()) || promoService.getAvailablePromotions(user.getEmail()).stream().anyMatch(p -> p.getId().equals(campaign.getSourceId()));
    }
    public boolean expired(EmailCampaign campaign) {

        if ("PROMO".equals(campaign.getKind())) {
            PromoCode p = promos.findById(campaign.getSourceId()).orElse(null);
            if (p == null || (p.getExpiryDate() != null && p.getExpiryDate().isBefore(LocalDate.now()))) return true;
            Instant starts = p.getStartDate() == null ? campaign.getCreatedAt() : p.getStartDate().atStartOfDay(ZoneId.of("Asia/Colombo")).toInstant();
            return starts.isBefore(Instant.now().minus(Duration.ofDays(14)));
        }
        return campaign.getCreatedAt().isBefore(Instant.now().minus(Duration.ofDays(14))) || !products.existsById(campaign.getSourceId());
    }
    public boolean ready(EmailCampaign campaign) {
        if ("PROMO".equals(campaign.getKind())) {
            PromoCode p = promos.findById(campaign.getSourceId()).orElse(null);
            return p != null && Boolean.TRUE.equals(p.getActive()) && (p.getStartDate() == null || !p.getStartDate().isAfter(LocalDate.now()));
        }
        return products.findById(campaign.getSourceId()).map(p -> Boolean.TRUE.equals(p.getIsActive()) && p.getAvailableStock() != null && p.getAvailableStock() > 0).orElse(false);
    }
    @Transactional(readOnly=true)
    public List<Candidate> audience(Long campaignId) {
        EmailCampaign campaign = campaigns.findById(campaignId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (expired(campaign) || !ready(campaign)) return List.of();
        List<Product> pool = "PRODUCT".equals(campaign.getKind()) ? products.findAllById(List.of(campaign.getSourceId())) : products.findAllActiveProductsList();
        List<Candidate> result = new ArrayList<>();
        for (EmailPreference p : preferences.findBySubscribedTrue()) {
            User u = users.findById(p.getUserId()).orElse(null);
            if (!activeCustomer(u, p) || p.getConsentAt() == null || p.getConsentAt().isAfter(campaign.getCreatedAt()) || !validPromo(campaign, u)) continue;
            List<Order> history = orders.findByUserId(u.getId());
            Candidate best = null;
            for (Product product : pool) {
                AudienceMatcher.Match match = matcher.match(product, p, history);
                if (match.score() >= 20 && (best == null || match.score() > best.score())) best = new Candidate(u.getId(), u.getEmail(), product.getId(), product.getName(), match.score(), match.reason());
            }
            if (best != null) result.add(best);
        }
        return result;
    }
    @Transactional
    public void prepare() {
        for (EmailCampaign campaign : campaigns.findByPreparedFalseOrderByIdAsc()) {
            if (expired(campaign)) { campaign.setPrepared(true); continue; }
            if (!ready(campaign)) continue;
            for (Candidate candidate : audience(campaign.getId())) {
                EmailDelivery d = new EmailDelivery(); d.setCampaignId(campaign.getId()); d.setUserId(candidate.userId());
                d.setProductId(candidate.productId()); d.setScore(candidate.score()); d.setReason(candidate.reason()); deliveries.save(d);
            }
            campaign.setPrepared(true);
        }
    }
    @Transactional(readOnly=true)
    public Map<String,Object> dashboard() {
        List<Map<String,Object>> rows = new ArrayList<>();
        for (EmailCampaign c : campaigns.findTop30ByOrderByIdDesc()) {
            Map<String,Object> row = new LinkedHashMap<>(); row.put("id",c.getId()); row.put("kind",c.getKind()); row.put("createdAt",c.getCreatedAt());
            row.put("sourceId",c.getSourceId()); row.put("prepared",c.isPrepared());
            for (String status : List.of("QUEUED","SENDING","SENT","RETRY","FAILED","SKIPPED")) row.put(status.toLowerCase(Locale.ROOT),deliveries.countByCampaignIdAndStatus(c.getId(),status));
            rows.add(row);
        }
        return Map.of("enabled",config.isEnabled(),"dailyLimit",config.getDailyLimit(),"weeklyCustomerLimit",config.getWeeklyCustomerLimit(),"campaigns",rows);
    }
}
