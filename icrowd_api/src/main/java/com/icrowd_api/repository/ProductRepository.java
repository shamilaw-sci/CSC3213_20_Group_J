package com.icrowd_api.repository;

import com.icrowd_api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    
    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR p.category = :category OR :category = 'All') AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:compatibility IS NULL OR p.compatiblePhone = :compatibility OR p.compatiblePhone = 'All' OR :compatibility = 'All')")
    List<Product> filterProducts(
        @Param("category") String category, 
        @Param("maxPrice") Double maxPrice, 
        @Param("compatibility") String compatibility
    );
}