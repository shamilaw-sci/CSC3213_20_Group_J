package com.icrowd_api.features.product;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductViewRepository extends JpaRepository<ProductView, Long> {

    @Query("SELECT pv FROM ProductView pv JOIN FETCH pv.product p WHERE pv.user.id = :userId ORDER BY pv.viewedAt DESC")
    List<ProductView> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT pv FROM ProductView pv JOIN FETCH pv.product p WHERE pv.sessionId = :sessionId ORDER BY pv.viewedAt DESC")
    List<ProductView> findRecentBySessionId(@Param("sessionId") String sessionId, Pageable pageable);

    @Query("SELECT pv.product.id, COUNT(pv) FROM ProductView pv WHERE pv.interactionType = :type GROUP BY pv.product.id ORDER BY COUNT(pv) DESC")
    List<Object[]> findMostViewedProductIds(@Param("type") String type, Pageable pageable);

    long countByProductId(Long productId);
}

