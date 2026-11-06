package com.icrowd_api.features.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ReviewRequest {

    @jakarta.validation.constraints.NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @jakarta.validation.constraints.NotBlank(message = "Review text is required")
    @jakarta.validation.constraints.Size(min = 5, max = 1000, message = "Review must contain 5 to 1000 characters")
    private String comment;
}
