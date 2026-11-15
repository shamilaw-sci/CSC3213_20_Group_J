package com.icrowd_api.features.marketing;
import com.icrowd_api.features.auth.User;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
public class SubscriptionConfirmation {
    private final EmailPreferenceRepository preferences;
    private final MarketingProperties config;
    private final ObjectProvider<JavaMailSender> mail;
    public SubscriptionConfirmation(EmailPreferenceRepository preferences, MarketingProperties config, ObjectProvider<JavaMailSender> mail) {
        this.preferences=preferences; this.config=config; this.mail=mail;
    }
    static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
    public void request(User user, EmailPreference preference) {
        Instant now=Instant.now();
        if (preference.getConfirmationRequestedAt()!=null && preference.getConfirmationRequestedAt().isAfter(now.minusSeconds(3600)))
            { if (preference.getConfirmationTokenHash()!=null) return;
              throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,"Please wait one hour before requesting another confirmation email."); }
        var uri=java.net.URI.create(config.getPublicApiUrl());
        if (config.getFrom().isBlank() || mail.getIfAvailable()==null || !"https".equals(uri.getScheme()) || uri.getHost()==null)
            throw new IllegalStateException("Email confirmation is unavailable. Your subscription has not been enabled.");
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String token=HexFormat.of().formatHex(bytes);
        preference.setSubscribed(false); preference.setConfirmedAt(null);
        preference.setConfirmationTokenHash(hash(token)); preference.setConfirmationExpiresAt(now.plusSeconds(86400));
        preference.setConfirmationRequestedAt(now);
        SimpleMailMessage message=new SimpleMailMessage();
        message.setFrom(config.getFrom()); message.setTo(user.getEmail()); message.setSubject("Confirm your iCrowd email subscription");
        message.setText("To receive product updates and offers, open this link and confirm your subscription:\n"
            + config.getPublicApiUrl().replaceAll("/+$","") + "/api/marketing/confirm?token="+token
            + "\nThe link expires in 24 hours. If you did not request this, you can ignore it.");
        mail.getObject().send(message);
    }
    @Transactional
    public boolean confirm(String token) {
        if (token==null || !token.matches("[a-f0-9]{64}")) return false;
        var found=preferences.findByConfirmationTokenHash(hash(token));
        if(found.isEmpty()) return false;
        EmailPreference preference=found.get();
        if(preference.getConfirmationExpiresAt()==null || preference.getConfirmationExpiresAt().isBefore(Instant.now())) return false;
        preference.setSubscribed(true); preference.setConfirmedAt(Instant.now()); preference.setConsentAt(Instant.now());
        preference.setConfirmationTokenHash(null); preference.setConfirmationExpiresAt(null);
        preference.setUpdatedAt(Instant.now());
        return true;
    }
}
