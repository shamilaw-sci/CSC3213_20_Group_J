package com.icrowd_api.features.promo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promo")
public class PromoCodeController {

    @Autowired
    private PromoCodeService promoCodeService;

    // ── Admin endpoints (ADMIN role required) ─────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromoCodeResponse>> getAll() {
        return ResponseEntity.ok(promoCodeService.getAllPromoCodes());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromoStatsResponse> getStats() {
        return ResponseEntity.ok(promoCodeService.getPromoStats());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody PromoCodeRequest request) {
        try {
            return ResponseEntity.ok(promoCodeService.createPromoCode(request));
        } catch (PromoCodeInvalidException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PromoCodeRequest request) {
        try {
            return ResponseEntity.ok(promoCodeService.updatePromoCode(id, request));
        } catch (PromoCodeNotFoundException ex) {
            return ResponseEntity.notFound().build();
        } catch (PromoCodeInvalidException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(promoCodeService.toggleActive(id));
        } catch (PromoCodeNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            promoCodeService.deletePromoCode(id);
            return ResponseEntity.ok(Map.of("message", "Promo code deleted successfully."));
        } catch (PromoCodeNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Customer endpoints ────────────────────────────────────────────────────

    @GetMapping("/available")
    public ResponseEntity<List<PromoCodeResponse>> getAvailablePromotions(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(promoCodeService.getAvailablePromotions(email));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(
            @RequestBody PromoValidationRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String email = authentication.getName();
        BigDecimal subTotal = request.getCartSubTotal() != null
                ? request.getCartSubTotal() : BigDecimal.ZERO;
        PromoValidationResponse result =
                promoCodeService.validateCode(request.getCode(), email, subTotal);
        // Always return 200 — valid/invalid is communicated in the response body
        return ResponseEntity.ok(result);
    }
}
