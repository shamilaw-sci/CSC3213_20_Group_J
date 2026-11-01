package com.icrowd_api.features.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Modifying
    @Query("UPDATE Product p SET p.availableStock = p.availableStock - :quantity WHERE p.id = :productId AND p.availableStock >= :quantity")
    int atomicDecrementStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    // Customer-facing: only active products
    Page<Product> findByIsActiveTrue(Pageable pageable);
    Optional<Product> findByIdAndIsActiveTrue(Long id);

    // Advanced dynamic query for customer search
    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
            "AND (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:category IS NULL OR :category = '' OR LOWER(p.category.name) = LOWER(:category))")
    Page<Product> searchAndFilterProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            Pageable pageable
    );

    // Fetch all active products for fuzzy search suggestions
    @Query("SELECT p FROM Product p WHERE p.isActive = true")
    List<Product> findAllActiveProductsList();

    // Admin: all products (including inactive), paginated
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category")
    Page<Product> findAllForAdmin(Pageable pageable);

    // Dashboard stats
    long countByIsActiveTrue();
    long countByIsActiveFalse();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.availableStock = 0")
    long countOutOfStock();

    // Low-stock products (stock <= threshold, active only)
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.availableStock <= :threshold ORDER BY p.availableStock ASC")
    List<Product> findLowStockProducts(@Param("threshold") int threshold);

    // Recent products (admin)
    @Query("SELECT p FROM Product p ORDER BY p.createdAt DESC")
    List<Product> findRecentProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.category.id IN :categoryIds ORDER BY p.averageRating DESC")
    Page<Product> findTopProductsByCategories(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);

    // Similar products in same category, excluding a specific product
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.category.id = :categoryId AND p.id != :excludeId ORDER BY p.averageRating DESC")
    Page<Product> findSimilarProductsByCategory(
            @Param("categoryId") Long categoryId,
            @Param("excludeId") Long excludeId,
            Pageable pageable);
}
