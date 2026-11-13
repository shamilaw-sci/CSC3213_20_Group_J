package com.icrowd_api.features.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackViewRequest {
    private Long productId;
    private String sessionId;
    private String interactionType; // VIEW, CART_ADD, WISHLIST
}

