package com.icrowd_api.features.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);

    @Query("SELECT DISTINCT oi.product.category.id FROM OrderItem oi JOIN oi.order o WHERE o.user.id = :userId")
    List<Long> findUserPurchasedCategoryIds(@Param("userId") Long userId);
}
