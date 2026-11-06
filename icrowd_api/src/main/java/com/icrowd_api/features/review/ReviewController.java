package com.icrowd_api.features.review;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, page, size));
    }

    @PutMapping("/{reviewId}")
    public ReviewResponse update(@PathVariable Long productId, @PathVariable Long reviewId, @Valid @RequestBody ReviewRequest request, Authentication authentication) {
        return reviewService.update(productId, reviewId, authentication.getName(), request);
    }
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable Long reviewId, Authentication authentication) {
        reviewService.delete(productId, reviewId, authentication.getName()); return ResponseEntity.noContent().build();
    }
    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        // authentication.getName() returns the email of the logged-in user
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.addReview(productId, email, request));
    }
}
