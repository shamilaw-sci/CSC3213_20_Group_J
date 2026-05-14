package com.icrowd_api.service;

import com.icrowd_api.model.Product;
import com.icrowd_api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    
    public List<Product> filterProducts(String category, Double maxPrice, String compatibility) {
        return productRepository.filterProducts(category, maxPrice, compatibility);
    }
}