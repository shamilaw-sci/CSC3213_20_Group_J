package com.icrowd_api.features.recommendation;

import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.recommendation.dto.FrequentlyBoughtTogetherResponse;
import com.icrowd_api.features.recommendation.dto.TrackViewRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @Autowired
    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/personalized")
    public ResponseEntity<List<Product>> getPersonalized(
            Authentication authentication,
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(
                resolveEmail(authentication), sessionId, limit
        ));
    }

    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<Product>> getSimilar(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getSimilarProducts(productId, limit));
    }

    @GetMapping("/frequently-bought-together/{productId}")
    public ResponseEntity<FrequentlyBoughtTogetherResponse> getFrequentlyBoughtTogether(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(recommendationService.getFrequentlyBoughtTogether(productId, limit));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Product>> getTrending(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getTrendingProducts(days, limit));
    }

    @GetMapping("/recently-viewed")
    public ResponseEntity<List<Product>> getRecentlyViewed(
            Authentication authentication,
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getRecentlyViewed(
                resolveEmail(authentication), sessionId, limit
        ));
    }

    @PostMapping("/track-view")
    public ResponseEntity<Void> trackView(
            Authentication authentication,
            @RequestBody TrackViewRequest request) {
        if (request != null && request.getProductId() != null) {
            recommendationService.trackProductView(
                    request.getProductId(),
                    resolveEmail(authentication),
                    request.getSessionId(),
                    request.getInteractionType()
            );
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/budget-aware")
    public ResponseEntity<List<Product>> getBudgetAware(
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getBudgetAwareRecommendations(
                maxPrice, minPrice, category, limit
        ));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return null;
    }
}

