package com.icrowd_api.features.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
     * Admin search query with pagination and status filtering
     */
    @Query(value = "SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND (" +
           ":query IS NULL OR :query = '' OR " +
           "LOWER(COALESCE(o.orderReference, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingFullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingEmail, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingPhone, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.user.email, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           countQuery = "SELECT COUNT(o) FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND (" +
           ":query IS NULL OR :query = '' OR " +
           "LOWER(COALESCE(o.orderReference, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingFullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingEmail, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.shippingPhone, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(o.user.email, '')) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Order> searchOrdersAdmin(@Param("query") String query, @Param("status") OrderStatus status, Pageable pageable);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN (com.icrowd_api.features.order.OrderStatus.CANCELLED, com.icrowd_api.features.order.OrderStatus.FAILED)")
    BigDecimal calculateTotalRevenue();

    List<Order> findTop5ByOrderByCreatedAtDesc();

    /**
     * Used by PromoCodeService to determine if a customer is "new"
     * (zero delivered/completed orders) for NEW_CUSTOMERS promo eligibility.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND o.status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED', 'DELIVERED')")
    long countCompletedOrdersByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT oi.product.category.id FROM OrderItem oi JOIN oi.order o WHERE o.user.id = :userId AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED')")
    List<Long> findUserPurchasedCategoryIds(@Param("userId") Long userId);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items oi " +
           "LEFT JOIN FETCH oi.product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "AND o.status IN :statuses")
    List<Order> findQualifyingOrdersBetween(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("statuses") java.util.Collection<OrderStatus> statuses
    );

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items oi " +
           "LEFT JOIN FETCH oi.product p " +
           "LEFT JOIN FETCH p.category " +
           "WHERE o.status IN :statuses")
    List<Order> findAllQualifyingOrders(@Param("statuses") java.util.Collection<OrderStatus> statuses);

    @Modifying
    @Query("UPDATE Order o SET o.createdAt = :createdAt WHERE o.id = :id")
    int updateOrderCreatedAt(@Param("id") Long id, @Param("createdAt") java.time.LocalDateTime createdAt);

    @Query("SELECT DISTINCT oi.product.id FROM OrderItem oi JOIN oi.order o WHERE o.user.id = :userId AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED')")
    List<Long> findUserPurchasedProductIds(@Param("userId") Long userId);
}
