package com.icrowd_api.features.product;

import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.apache.commons.text.similarity.LevenshteinDistance;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    // ── Customer-facing ────────────────────────────────────────────────────────

    public Page<Product> getAllActiveProducts(int page, int size) {
        return productRepository.findByIsActiveTrue(PageRequest.of(page, size));
    }

    public Page<Product> searchAndFilterProducts(String keyword, String category, String sortParam, int page, int size) {
        Sort sort = Sort.unsorted();
        if (sortParam != null) {
            switch (sortParam.toLowerCase()) {
                case "price_asc" -> sort = Sort.by(Sort.Direction.ASC, "price");
                case "price_desc" -> sort = Sort.by(Sort.Direction.DESC, "price");
            }
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.searchAndFilterProducts(
                (keyword == null) ? "" : keyword.trim(),
                (category == null) ? "" : category.trim(),
                pageable
        );
    }

    public Product getProductById(Long id) {
        return productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new RuntimeException("Product not found or inactive"));
    }

    public SuggestionResponse getSearchSuggestions(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new SuggestionResponse(List.of(), List.of(), List.of());
        }
        String searchKey = keyword.toLowerCase().trim();
        List<Product> allProducts = productRepository.findAllActiveProductsList();
        LevenshteinDistance distance = new LevenshteinDistance();

        List<String> terms = allProducts.stream()
                .map(p -> p != null ? p.getName() : "")
                .filter(name -> name != null && !name.isEmpty())
                .distinct()
                .filter(name -> {
                    String lowerName = name.toLowerCase();
                    if (lowerName.contains(searchKey)) return true;
                    for (String word : lowerName.split("\\s+")) {
                        int allowed = word.length() <= 4 ? 1 : 2;
                        if (distance.apply(word, searchKey) <= allowed) return true;
                    }
                    return false;
                })
                .sorted((n1, n2) -> {
                    boolean c1 = n1.toLowerCase().contains(searchKey);
                    boolean c2 = n2.toLowerCase().contains(searchKey);
                    if (c1 && !c2) return -1;
                    if (!c1 && c2) return 1;
                    return n1.compareToIgnoreCase(n2);
                })
                .limit(5).collect(Collectors.toList());

        List<String> categories = allProducts.stream()
                .map(p -> (p != null && p.getCategory() != null) ? p.getCategory().getName() : "")
                .filter(cat -> cat != null && !cat.isEmpty())
                .distinct()
                .filter(cat -> {
                    String lowerCat = cat.toLowerCase();
                    if (lowerCat.contains(searchKey)) return true;
                    for (String word : lowerCat.split("\\s+")) {
                        int allowed = word.length() <= 4 ? 1 : 2;
                        if (distance.apply(word, searchKey) <= allowed) return true;
                    }
                    return false;
                })
                .limit(3).collect(Collectors.toList());

        List<Product> products = allProducts.stream()
                .filter(p -> {
                    String lowerName = p.getName().toLowerCase();
                    if (lowerName.contains(searchKey)) return true;
                    for (String word : lowerName.split("\\s+")) {
                        int allowed = word.length() <= 4 ? 1 : 2;
                        if (distance.apply(word, searchKey) <= allowed) return true;
                    }
                    return false;
                })
                .sorted((p1, p2) -> {
                    boolean c1 = p1.getName().toLowerCase().contains(searchKey);
                    boolean c2 = p2.getName().toLowerCase().contains(searchKey);
                    if (c1 && !c2) return -1;
                    if (!c1 && c2) return 1;
                    return p1.getName().compareToIgnoreCase(p2.getName());
                })
                .limit(3).collect(Collectors.toList());

        return new SuggestionResponse(terms, categories, products);
    }

    // ── Admin CRUD ─────────────────────────────────────────────────────────────

    public Page<Product> getAllProductsForAdmin(int page, int size) {
        return productRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    public Product getProductByIdForAdmin(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.categoryId()));

        Product product = Product.builder()
                .sku(request.sku())
                .name(request.name())
                .description(request.description())
                .category(category)
                .price(request.price())
                .availableStock(request.availableStock())
                .imageUrls(request.imageUrls() != null ? request.imageUrls() : List.of())
                .tags(request.tags() != null ? request.tags() : List.of())
                .isActive(request.isActive() != null ? request.isActive() : true)
                .build();

        return productRepository.save(product);
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        if (request.name() != null) {
            product.setName(request.name());
        }
        if (request.description() != null) {
            product.setDescription(request.description());
        }
        if (request.price() != null) {
            product.setPrice(request.price());
        }
        if (request.availableStock() != null) {
            product.setAvailableStock(request.availableStock());
        }
        if (request.imageUrls() != null) {
            product.setImageUrls(request.imageUrls());
        }
        if (request.tags() != null) {
            product.setTags(request.tags());
        }
        if (request.isActive() != null) {
            product.setIsActive(request.isActive());
        }
        if (request.sku() != null) {
            product.setSku(request.sku());
        }

        return productRepository.save(product);
    }

    public void softDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }

    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalProducts", productRepository.count());
        stats.put("activeProducts", productRepository.countByIsActiveTrue());
        stats.put("inactiveProducts", productRepository.countByIsActiveFalse());
        stats.put("outOfStock", productRepository.countOutOfStock());
        return stats;
    }

    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findLowStockProducts(threshold);
    }

    public List<Product> getRecentProducts(int limit) {
        return productRepository.findRecentProducts(PageRequest.of(0, limit));
    }
}
