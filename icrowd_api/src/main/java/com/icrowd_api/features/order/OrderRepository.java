package com.icrowd_api.features.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Modifying
    @Query("UPDATE Order o SET o.status = com.icrowd_api.features.order.OrderStatus.CANCELLED WHERE o.status = com.icrowd_api.features.order.OrderStatus.PENDING_PAYMENT AND o.createdAt < :cutoff AND NOT EXISTS (SELECT p.id FROM Payment p WHERE p.order = o)")
    int expireUnstarted(@Param("cutoff") java.time.LocalDateTime cutoff);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findForUpdate(@Param("id") Long id);

    Optional<Order> findByUserIdAndCheckoutKey(Long userId, String checkoutKey);
    List<Order> findByUserId(Long userId);
    List<Order> findByUserEmailOrderByCreatedAtDesc(String email);

    /**
     * Used by PromoCodeService to determine if a customer is "new"
     * (zero delivered/completed orders) for NEW_CUSTOMERS promo eligibility.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND o.status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED', 'DELIVERED')")
    long countCompletedOrdersByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT oi.product.category.id FROM OrderItem oi JOIN oi.order o WHERE o.user.id = :userId")
    List<Long> findUserPurchasedCategoryIds(@Param("userId") Long userId);
}
