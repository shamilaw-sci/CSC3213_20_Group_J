package com.icrowd_api.features.review;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private Integer rating;
    private String title;
    private String comment;
    private String authorName; // Extracted from Customer/Admin or email
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        String author = "Anonymous";
        if (review.getUser() != null) {
            if (review.getUser().getCustomer() != null) {
                author = review.getUser().getCustomer().getFirstName() + " " + review.getUser().getCustomer().getLastName();
            } else if (review.getUser().getAdmin() != null) {
                author = review.getUser().getAdmin().getFirstName() + " " + review.getUser().getAdmin().getLastName();
            } else if (review.getUser().getEmail() != null) {
                author = review.getUser().getEmail().split("@")[0];
            }
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .authorName(author.trim())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
