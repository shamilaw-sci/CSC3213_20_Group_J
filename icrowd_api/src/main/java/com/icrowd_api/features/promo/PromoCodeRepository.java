package com.icrowd_api.features.promo;

import com.icrowd_api.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {

    Optional<PromoCode> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    long countByActiveTrue();

    @Query("SELECT COUNT(p) FROM PromoCode p WHERE p.expiryDate IS NOT NULL AND p.expiryDate < CURRENT_DATE")
    long countExpired();

    @Query("SELECT COALESCE(SUM(p.usageCount), 0) FROM PromoCode p")
    long sumTotalRedemptions();

    @Modifying
    @Query("UPDATE PromoCode p SET p.usageCount = p.usageCount + 1 WHERE p.id = :id")
    void incrementUsageCount(Long id);
}
