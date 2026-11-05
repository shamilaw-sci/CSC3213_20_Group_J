package com.icrowd_api.features.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    boolean existsByProduct_IdAndUser_Id(Long productId, Long userId);
    java.util.Optional<Review> findByIdAndProduct_Id(Long id, Long productId);
    Page<Review> findByProduct_Id(Long productId, Pageable pageable);
    java.util.List<Review> findByUser_IdOrderByCreatedAtDesc(Long userId);
    long countByProduct_Id(Long productId);
    @org.springframework.data.jpa.repository.Query("select coalesce(avg(r.rating), 0.0) from Review r where r.product.id = :productId")
    double average(@org.springframework.data.repository.query.Param("productId") Long productId);
    // Spring Data JPA will automatically translate this to:
    // SELECT * FROM reviews WHERE product_id = ? ORDER BY rating DESC, created_at DESC
    Page<Review> findByProduct_IdOrderByRatingDescCreatedAtDesc(Long productId, Pageable pageable);
}
