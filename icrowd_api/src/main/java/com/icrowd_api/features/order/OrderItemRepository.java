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

    @Query("SELECT oi.product.id FROM OrderItem oi JOIN oi.order o WHERE o.createdAt >= :startDate AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED') AND o.paymentStatus IN ('SUCCESS','PAID','DUE_ON_DELIVERY') AND oi.product.isActive=true GROUP BY oi.product.id ORDER BY SUM(oi.quantity) DESC")
    List<Long> findTopSellingProductIds(@Param("startDate") LocalDateTime startDate, Pageable pageable);

    @Query("SELECT oi2.product.id, COUNT(oi2.product.id) " +
           "FROM OrderItem oi1 " +
           "JOIN OrderItem oi2 ON oi1.order.id = oi2.order.id " +
           "WHERE oi1.product.id = :productId AND oi2.product.id != :productId " +
           "AND oi1.order.status IN :statuses " +
           "GROUP BY oi2.product.id ORDER BY COUNT(oi2.product.id) DESC")
    List<Object[]> findFrequentlyBoughtTogetherProductIds(
            @Param("productId") Long productId,
            @Param("statuses") java.util.Collection<OrderStatus> statuses,
            Pageable pageable
    );
    @Query("SELECT oi.product.id FROM OrderItem oi WHERE oi.order.status IN ('DELIVERED', 'COMPLETED') AND oi.product.id NOT IN :productIds AND oi.order.id IN (SELECT seed.order.id FROM OrderItem seed WHERE seed.product.id IN :productIds) GROUP BY oi.product.id ORDER BY COUNT(DISTINCT oi.order.id) DESC, oi.product.id ASC")
    List<Long> findFrequentlyBoughtTogether(@Param("productIds") List<Long> productIds, Pageable pageable);
}
