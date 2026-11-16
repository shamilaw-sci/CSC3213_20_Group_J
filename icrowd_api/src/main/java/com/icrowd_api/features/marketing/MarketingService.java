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
    private final SubscriptionConfirmation confirmation;

    public record PreferenceView(boolean subscribed, String interests, String brands, boolean pendingConfirmation) {
        public PreferenceView(boolean subscribed, String interests, String brands) { this(subscribed,interests,brands,false); }
    }
    private PreferenceView view(EmailPreference p) {
        return new PreferenceView(p.isSubscribed() && p.getConfirmedAt()!=null,p.getInterests(),p.getBrands(),p.getConfirmationTokenHash()!=null);
    }
    public record Candidate(Long userId, String email, Long productId, String productName, int score, String reason) {}
    private User user(String email) { return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    @Transactional(readOnly=true)
    public PreferenceView preference(String email) {
        return preferences.findById(user(email).getId()).map(p -> view(p))
                .orElse(new PreferenceView(false, "", ""));
    }
    @Transactional
    public PreferenceView savePreference(String email, PreferenceView input) {
        User u = users.findForCheckout(email).orElseThrow();
        if (!"CUSTOMER".equals(u.getRole())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        EmailPreference p = preferences.findById(u.getId()).orElseGet(() -> {
            EmailPreference created = new EmailPreference(); created.setUserId(u.getId());
            created.setUnsubscribeToken(UUID.randomUUID().toString() + UUID.randomUUID()); return created;
        });
        if (input.subscribed() && (!p.isSubscribed() || p.getConfirmedAt()==null)) confirmation.request(u,p);
        if (!input.subscribed()) { p.setSubscribed(false); p.setConfirmationTokenHash(null); p.setConfirmationExpiresAt(null); }
        p.setInterests(clean(input.interests())); p.setBrands(clean(input.brands()));
        p.setUpdatedAt(Instant.now()); preferences.save(p);
        return view(p);
    }
    private String clean(String value) {
        if (value == null) return "";
        if (value.length() > 500) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferences must be at most 500 characters");
        return value.trim();
    }
    @Transactional
    public void unsubscribe(String token) {
        preferences.findByUnsubscribeToken(token).ifPresent(p -> { p.setSubscribed(false); p.setConfirmationTokenHash(null); p.setConfirmationExpiresAt(null); p.setUpdatedAt(Instant.now()); });
    }
    public boolean activeCustomer(User user, EmailPreference preference) {
        return user != null && preference != null && preference.isSubscribed() && preference.getConfirmedAt()!=null && "CUSTOMER".equals(user.getRole()) && "ACTIVE".equals(user.getAccountStatus());
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
        return audience(campaigns.findById(campaignId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)), preferences.findTop50BySubscribedTrueAndUserIdGreaterThanOrderByUserIdAsc(0L));
    }
    public AudienceMatcher.Affinity affinity(Long id) {
        return matcher.fromRows(orders.purchaseAffinity(id,com.icrowd_api.features.analytics.AnalyticsService.QUALIFYING_ORDER_STATUSES,com.icrowd_api.features.analytics.AnalyticsService.QUALIFYING_PAYMENT_STATUSES));
    }
    private List<Candidate> audience(EmailCampaign campaign,List<EmailPreference> batch) {
        if (expired(campaign) || !ready(campaign)) return List.of();
        List<Product> pool = "PRODUCT".equals(campaign.getKind()) ? products.findAllById(List.of(campaign.getSourceId())) : products.findCatalogCandidates("",org.springframework.data.domain.PageRequest.of(0,500));
        List<Candidate> result = new ArrayList<>();
        Map<Long,User> batchUsers=new HashMap<>(); users.findAllById(batch.stream().map(EmailPreference::getUserId).toList()).forEach(u -> batchUsers.put(u.getId(),u));
        for (EmailPreference p : batch) {
            User u = batchUsers.get(p.getUserId());
            if (!activeCustomer(u, p) || p.getConsentAt() == null || p.getConsentAt().isAfter(campaign.getCreatedAt()) || !validPromo(campaign, u)) continue;
            AudienceMatcher.Affinity history = affinity(u.getId());
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
        if (!config.isEnabled()) return;
        for (EmailCampaign campaign : campaigns.findTop10ByPreparedFalseOrderByIdAsc()) {
            if (expired(campaign)) { campaign.setPrepared(true); continue; }
            if (!ready(campaign)) continue;
            List<EmailPreference> batch=preferences.findTop50BySubscribedTrueAndUserIdGreaterThanOrderByUserIdAsc(campaign.getAfterUserId()==null ? 0L : campaign.getAfterUserId());
            for (Candidate candidate : audience(campaign,batch)) {
                EmailDelivery d = new EmailDelivery(); d.setCampaignId(campaign.getId()); d.setUserId(candidate.userId());
                d.setProductId(candidate.productId()); d.setScore(candidate.score()); d.setReason(candidate.reason()); deliveries.save(d);
            }
            if (!batch.isEmpty()) campaign.setAfterUserId(batch.getLast().getUserId());
            campaign.setPrepared(batch.size()<50);
            break; // At most fifty recipients are prepared in one transaction.
        }
    }
    @Transactional(readOnly=true)
    public Map<String,Object> dashboard() {
        List<Map<String,Object>> rows = new ArrayList<>();
        List<EmailCampaign> recent=campaigns.findTop30ByOrderByIdDesc();
        Map<Long,Map<String,Long>> counts=new HashMap<>();
        if (!recent.isEmpty()) for (var count : deliveries.countCampaignStatuses(recent.stream().map(EmailCampaign::getId).toList())) counts.computeIfAbsent((Long)count[0],k -> new HashMap<>()).put((String)count[1],((Number)count[2]).longValue());
        for (EmailCampaign c : recent) {
            Map<String,Object> row = new LinkedHashMap<>(); row.put("id",c.getId()); row.put("kind",c.getKind()); row.put("createdAt",c.getCreatedAt());
            row.put("sourceId",c.getSourceId()); row.put("prepared",c.isPrepared());
            for (String status : List.of("QUEUED","SENDING","SENT","RETRY","FAILED","SKIPPED")) row.put(status.toLowerCase(Locale.ROOT),counts.getOrDefault(c.getId(),Map.of()).getOrDefault(status,0L));
            rows.add(row);
        }
        return Map.of("enabled",config.isEnabled(),"dailyLimit",config.getDailyLimit(),"weeklyCustomerLimit",config.getWeeklyCustomerLimit(),"campaigns",rows);
    }
}
