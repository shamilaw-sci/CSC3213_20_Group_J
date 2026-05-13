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


    // 1. Fetch all products in bulk
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. Fetch products by Category ID
    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
}