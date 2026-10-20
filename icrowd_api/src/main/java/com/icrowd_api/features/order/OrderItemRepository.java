package com.icrowd_api.features.order;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi.product.id FROM OrderItem oi JOIN oi.order o WHERE o.createdAt >= :startDate AND o.status != 'CANCELLED' GROUP BY oi.product.id ORDER BY SUM(oi.quantity) DESC")
    List<Long> findTopSellingProductIds(@Param("startDate") LocalDateTime startDate, Pageable pageable);
}
