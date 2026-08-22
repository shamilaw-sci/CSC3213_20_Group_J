package com.icrowd_api.features.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Spring Data JPA will automatically translate this to:
    // SELECT * FROM reviews WHERE product_id = ? ORDER BY rating DESC, created_at DESC
    Page<Review> findByProduct_IdOrderByRatingDescCreatedAtDesc(Long productId, Pageable pageable);
}
