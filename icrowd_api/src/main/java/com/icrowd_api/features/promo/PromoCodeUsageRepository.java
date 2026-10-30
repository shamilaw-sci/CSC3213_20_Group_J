package com.icrowd_api.features.promo;

import com.icrowd_api.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface PromoCodeUsageRepository extends JpaRepository<PromoCodeUsage, Long> {

    long countByPromoCodeAndCustomer(PromoCode promoCode, User customer);

    /**
     * Sum the discount_amount stored on every order that used a promo code.
     * Returns null when no usages exist; callers must handle null.
     */
    @Query("SELECT COALESCE(SUM(u.order.discountAmount), 0) FROM PromoCodeUsage u WHERE u.order IS NOT NULL")
    BigDecimal sumTotalDiscountGiven();
}
