package com.icrowd_api.features.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);

    /**
     * Used by PromoCodeService to determine if a customer is "new"
     * (zero delivered/completed orders) for NEW_CUSTOMERS promo eligibility.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND o.status IN ('DELIVERED', 'PROCESSING', 'PENDING')")
    long countCompletedOrdersByUserId(Long userId);
}
