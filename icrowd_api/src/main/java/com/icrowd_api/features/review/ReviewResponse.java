package com.icrowd_api.features.review;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Integer rating;
    private String title;
    private String comment;
    private String authorName; // Extracted from User.firstName + User.lastName
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        String author = "Anonymous";
        if (review.getUser() != null) {
            author = review.getUser().getFirstName() + " " + review.getUser().getLastName();
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .authorName(author.trim())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
