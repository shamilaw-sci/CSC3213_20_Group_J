package com.icrowd_api.features.marketing;

import com.icrowd_api.features.auth.*;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.product.*;
import com.icrowd_api.features.promo.*;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;
import java.time.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component @RequiredArgsConstructor
public class MarketingWorker {
    private final MarketingProperties config;
    private final MarketingService service;
    private final EmailQueueLockRepository locks;
    private final EmailDeliveryRepository deliveries;
    private final EmailAttemptRepository attempts;
    private final EmailCampaignRepository campaigns;
    private final EmailPreferenceRepository preferences;
    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final PromoCodeRepository promos;
    private final AudienceMatcher matcher;
    private final ObjectProvider<JavaMailSender> mail;
    private final TransactionTemplate tx;
    private volatile boolean initialized;
    public record Outgoing(Long id, String recipient, String subject, String plain, String html, String unsubscribe) {}
    @EventListener(ApplicationReadyEvent.class)
    public void initialize() {
        try { if (!locks.existsById(1L)) locks.saveAndFlush(new EmailQueueLock()); }
        catch (org.springframework.dao.DataIntegrityViolationException concurrentStartup) { if (!locks.existsById(1L)) throw concurrentStartup; }
        initialized = true;
    }
    @Scheduled(fixedDelayString="${app.marketing.interval-ms:60000}")
    public void tick() {
        if (!initialized) return;
        // Queue generation is safe with delivery disabled; no SMTP connection is made.
        tx.executeWithoutResult(status -> { locks.acquire(); service.prepare(); });
        if (!config.isEnabled()) return;
        validateConfiguration();
        for (int i=0; i<5; i++) {
            Outgoing outgoing = tx.execute(status -> claim());
            if (outgoing == null) return;
            deliver(outgoing);
        }
    }
    private void validateConfiguration() {
        if (config.getFrom().isBlank() || mail.getIfAvailable() == null) throw new IllegalStateException("Set the marketing sender and SMTP credentials before enabling delivery");
        for (String url : List.of(config.getFrontendUrl(), config.getPublicApiUrl())) {
            URI uri = URI.create(url);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null)
                throw new IllegalStateException("Marketing links require public HTTPS base URLs");
        }
    }
    private Outgoing claim() {
        locks.acquire();
        Instant now = Instant.now();
        if (attempts.countByAttemptedAtAfter(now.minus(Duration.ofDays(1))) >= config.getDailyLimit()) return null;
        for (EmailDelivery d : deliveries.findTop100ByStatusInAndNextAttemptAtLessThanEqualOrderByIdAsc(List.of("QUEUED","RETRY"),now)) {
            User u = users.findById(d.getUserId()).orElse(null);
            EmailPreference pref = preferences.findById(d.getUserId()).orElse(null);
            EmailCampaign c = campaigns.findById(d.getCampaignId()).orElse(null);
            Product p = products.findById(d.getProductId()).orElse(null);
            if (!service.activeCustomer(u,pref) || c == null || p == null || service.expired(c) || !service.ready(c) || !service.validPromo(c,u)
                    || matcher.match(p,pref,orders.findByUserId(u.getId())).score() < 20) {
                d.setStatus("SKIPPED"); continue;
            }
            if (attempts.countByUserIdAndAttemptedAtAfter(u.getId(),now.minus(Duration.ofDays(7))) >= config.getWeeklyCustomerLimit()) {
                d.setNextAttemptAt(now.plus(Duration.ofHours(24))); continue;
            }
            Outgoing outgoing = render(d,u,p,pref,c);
            // Commit before contacting SMTP: interrupted/ambiguous sends are not automatically repeated.
            d.setStatus("SENDING"); d.setLastAttemptAt(now); d.setAttempts(d.getAttempts()+1);
            EmailAttempt attempt = new EmailAttempt(); attempt.setUserId(u.getId()); attempt.setAttemptedAt(now); attempts.save(attempt);
            return outgoing;
        }
        return null;
    }
    private Outgoing render(EmailDelivery d, User user, Product p, EmailPreference preference, EmailCampaign c) {
        String title = "New arrival: " + p.getName();
        String details = "Price: LKR " + p.getPrice() + ". " + d.getReason() + ".";
        String url = base(config.getFrontendUrl()) + "/product/" + p.getId();
        if ("PROMO".equals(c.getKind())) {
            PromoCode promo = promos.findById(c.getSourceId()).orElseThrow();
            title = "An offer for you: " + promo.getCode();
            details += " Use code " + promo.getCode() + " for " + promo.getDiscountValue() + (promo.getDiscountType() == DiscountType.PERCENTAGE ? "% off." : " LKR off.");
            if (promo.getMinimumOrderAmount() != null) details += " Minimum order: LKR " + promo.getMinimumOrderAmount() + ".";
            if (promo.getMaxDiscountAmount() != null) details += " Maximum discount: LKR " + promo.getMaxDiscountAmount() + ".";
            if (promo.getExpiryDate() != null) details += " Expires: " + promo.getExpiryDate() + ".";
            details += " Usage limits and checkout eligibility apply.";
            url += "?promo=" + URLEncoder.encode(promo.getCode(),StandardCharsets.UTF_8);
        }
        String unsubscribe = base(config.getPublicApiUrl()) + "/api/marketing/unsubscribe?token=" + preference.getUnsubscribeToken();
        String plain = title + "\n" + p.getName() + "\n" + details + "\nView product: " + url + "\nUnsubscribe: " + unsubscribe;
        String image = "";
        if (p.getImageUrls() != null && !p.getImageUrls().isEmpty() && p.getImageUrls().get(0).startsWith("https://"))
            image = "<img width='240' alt='' src='" + esc(p.getImageUrls().get(0)) + "'>";
        String html = "<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px'><h1>" + esc(title) + "</h1>" + image
            + "<h2>" + esc(p.getName()) + "</h2><p>" + esc(details) + "</p><p><a style='display:inline-block;background:#111;color:#fff;padding:14px 22px;border-radius:8px' href='" + esc(url)
            + "'>View product and offer</a></p><p>You received this because you subscribed to relevant product updates.</p><a href='" + esc(unsubscribe) + "'>Unsubscribe</a></body></html>";
        return new Outgoing(d.getId(),user.getEmail(),title.replaceAll("[\r\n]"," "),plain,html,unsubscribe);
    }
    private String base(String url) { return url.replaceAll("/+$", ""); }
    private String esc(String value) { return HtmlUtils.htmlEscape(value); }
    private void deliver(Outgoing outgoing) {
        String result = "SENT", failure = null;
        try {
            JavaMailSender sender = mail.getObject();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,true,"UTF-8");
            helper.setFrom(config.getFrom()); helper.setTo(outgoing.recipient()); helper.setSubject(outgoing.subject());
            helper.setText(outgoing.plain(),outgoing.html());
            message.setHeader("List-Unsubscribe","<"+outgoing.unsubscribe()+">");
            message.setHeader("List-Unsubscribe-Post","List-Unsubscribe=One-Click");
            sender.send(message);
        } catch (Exception exception) {
            // Only connection failures are safe to retry. SMTP can accept mail before a later error.
            boolean connectionFailure = false;
            for (Throwable cause=exception; cause!=null; cause=cause.getCause())
                if (cause instanceof ConnectException || cause instanceof UnknownHostException) connectionFailure = true;
            result = connectionFailure ? "RETRY" : "FAILED";
            failure = connectionFailure ? "Connection failed before delivery" : "Delivery not confirmed; inspect sender before retrying";
        }
        final String state=result, error=failure;
        tx.executeWithoutResult(status -> deliveries.findById(outgoing.id()).ifPresent(d -> {
            d.setStatus("RETRY".equals(state) && d.getAttempts() >= 3 ? "FAILED" : state); d.setFailure(error);
            d.setNextAttemptAt(Instant.now().plus(Duration.ofMinutes(15L * Math.max(1,d.getAttempts()))));
        }));
    }
}
