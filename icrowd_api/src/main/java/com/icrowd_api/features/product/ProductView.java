package com.icrowd_api.features.product;

import com.icrowd_api.features.auth.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "product_views",
    indexes = {
        @Index(name = "idx_product_views_user_viewed", columnList = "user_id, viewed_at"),
        @Index(name = "idx_product_views_session_viewed", columnList = "session_id, viewed_at"),
        @Index(name = "idx_product_views_product_type", columnList = "product_id, interaction_type")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Builder.Default
    @Column(name = "interaction_type", length = 20, nullable = false)
    private String interactionType = "VIEW";

    @CreationTimestamp
    @Column(name = "viewed_at", updatable = false)
    private LocalDateTime viewedAt;
}

