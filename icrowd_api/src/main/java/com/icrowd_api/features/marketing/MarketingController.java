package com.icrowd_api.features.marketing;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.MediaType;
import java.security.Principal;
import java.util.*;
@RestController @RequiredArgsConstructor
public class MarketingController {
    private final MarketingService service;
    @GetMapping("/api/marketing/preferences")
    public MarketingService.PreferenceView preference(Principal principal) { return service.preference(principal.getName()); }
    @PutMapping("/api/marketing/preferences")
    public MarketingService.PreferenceView save(Principal principal, @RequestBody MarketingService.PreferenceView input) { return service.savePreference(principal.getName(), input); }
    @GetMapping(value="/api/marketing/unsubscribe",produces=MediaType.TEXT_HTML_VALUE)
    public String confirm(@RequestParam String token) {
        // GET is intentionally read-only: link scanners must not change subscriptions.
        if (!token.matches("[a-fA-F0-9-]{72}")) return "Invalid unsubscribe link.";
        return "<html><body><h1>Email preferences</h1><form method='post'><input type='hidden' name='token' value='" + token + "'><button type='submit'>Unsubscribe from promotional emails</button></form></body></html>";
    }
    @PostMapping(value="/api/marketing/unsubscribe",produces=MediaType.TEXT_HTML_VALUE)
    public String unsubscribe(@RequestParam String token) { service.unsubscribe(token); return "<html><body><h1>You have been unsubscribed.</h1><p>You can subscribe again from your account preferences.</p></body></html>"; }
    @GetMapping("/api/admin/marketing") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> dashboard() { return service.dashboard(); }
    @GetMapping("/api/admin/marketing/{id}/audience") @PreAuthorize("hasRole('ADMIN')")
    public List<MarketingService.Candidate> audience(@PathVariable Long id) { return service.audience(id); }
}
