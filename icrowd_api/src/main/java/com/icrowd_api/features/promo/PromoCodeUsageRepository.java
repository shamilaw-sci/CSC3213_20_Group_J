package com.icrowd_api.features.promo;

import com.icrowd_api.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface PromoCodeUsageRepository extends JpaRepository<PromoCodeUsage, Long> {
    @Query("SELECT COUNT(u) FROM PromoCodeUsage u WHERE u.promoCode = :promo " +
           "AND (:customer IS NULL OR u.customer = :customer) " +
           "AND (:excludedOrder IS NULL OR u.order.id <> :excludedOrder) " +
           "AND (u.order IS NULL OR u.order.status IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED','COMPLETED') " +
           "OR (u.order.status IN ('PENDING_PAYMENT','FAILED') AND u.order.createdAt > :cutoff))")
    long countReserved(@Param("promo") PromoCode promo, @Param("customer") User customer,
                       @Param("excludedOrder") Long excludedOrder, @Param("cutoff") java.time.LocalDateTime cutoff);


    @Query("SELECT COUNT(u) FROM PromoCodeUsage u WHERE u.promoCode = :promoCode AND u.customer = :customer " +
           "AND (u.order IS NULL OR u.order.status IN (com.icrowd_api.features.order.OrderStatus.CONFIRMED, " +
           "com.icrowd_api.features.order.OrderStatus.PROCESSING, " +
           "com.icrowd_api.features.order.OrderStatus.SHIPPED, " +
           "com.icrowd_api.features.order.OrderStatus.DELIVERED, " +
           "com.icrowd_api.features.order.OrderStatus.COMPLETED))")
    long countByPromoCodeAndCustomer(@Param("promoCode") PromoCode promoCode, @Param("customer") User customer);

    @Query("SELECT COUNT(u) FROM PromoCodeUsage u WHERE u.promoCode = :promoCode " +
           "AND (u.order IS NULL OR u.order.status IN (com.icrowd_api.features.order.OrderStatus.CONFIRMED, " +
           "com.icrowd_api.features.order.OrderStatus.PROCESSING, " +
           "com.icrowd_api.features.order.OrderStatus.SHIPPED, " +
           "com.icrowd_api.features.order.OrderStatus.DELIVERED, " +
           "com.icrowd_api.features.order.OrderStatus.COMPLETED))")
    long countConfirmedByPromoCode(@Param("promoCode") PromoCode promoCode);

    /**
     * Sum the discount_amount stored on every order that used a promo code.
     * Returns null when no usages exist; callers must handle null.
     */
    @Query("SELECT COALESCE(SUM(u.order.discountAmount), 0) FROM PromoCodeUsage u WHERE u.order IS NOT NULL")
    BigDecimal sumTotalDiscountGiven();
}
