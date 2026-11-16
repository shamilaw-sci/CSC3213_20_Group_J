package com.icrowd_api.features.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    @Query("SELECT DISTINCT ci.product.category.id FROM CartItem ci JOIN ci.cart c WHERE c.user.id = :userId")
    List<Long> findUserCartCategoryIds(@Param("userId") Long userId);
    @Query("SELECT DISTINCT ci.product.id FROM CartItem ci JOIN ci.cart c WHERE c.user.id = :userId")
    List<Long> findUserCartProductIds(@Param("userId") Long userId);
}
