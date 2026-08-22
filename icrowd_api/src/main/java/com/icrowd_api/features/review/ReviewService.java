package com.icrowd_api.features.review;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReviewTitleGenerator titleGenerator;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository, 
                         UserRepository userRepository, ReviewTitleGenerator titleGenerator) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.titleGenerator = titleGenerator;
    }

    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        return reviewRepository.findByProduct_IdOrderByRatingDescCreatedAtDesc(productId, PageRequest.of(page, size))
                .map(ReviewResponse::fromEntity);
    }

    public ReviewResponse addReview(Long productId, String email, ReviewRequest request) {
        // 1. Fetch Product
        com.icrowd_api.features.product.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 2. Find the User who is posting the review
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Generate the snappy title automatically
        String generatedTitle = titleGenerator.generateTitle(request.getComment());

        // 4. Save Review
        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .title(generatedTitle)
                .build();

        Review savedReview = reviewRepository.save(review);

        // 5. Update Product Rating (Incremental average calculation)
        int currentCount = product.getReviewCount() == null ? 0 : product.getReviewCount();
        double currentAverage = product.getAverageRating() == null ? 0.0 : product.getAverageRating();
        
        double newTotalScore = (currentAverage * currentCount) + request.getRating();
        int newCount = currentCount + 1;
        double newAverage = newTotalScore / newCount;
        
        // Round to 1 decimal place
        newAverage = Math.round(newAverage * 10.0) / 10.0;
        
        product.setReviewCount(newCount);
        product.setAverageRating(newAverage);
        productRepository.save(product);

        return ReviewResponse.fromEntity(savedReview);
    }
}
