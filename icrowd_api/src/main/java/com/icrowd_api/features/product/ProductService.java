package com.icrowd_api.features.product;

import com.icrowd_api.features.audit.AuditService;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.cart.CartRepository;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import com.icrowd_api.features.order.OrderItemRepository;
import com.icrowd_api.features.order.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.apache.commons.text.similarity.LevenshteinDistance;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          OrderRepository orderRepository,
                          OrderItemRepository orderItemRepository,
                          CartRepository cartRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    // Convenience constructor for tests with only core repositories
    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          AuditService auditService) {
        this(productRepository, categoryRepository, null, null, null, null, auditService);
    }

    // ── Customer-facing ────────────────────────────────────────────────────────

    public List<String> getBrands(String category) {
        if (category == null || category.isBlank()) return List.of();
        var brands = new java.util.TreeSet<String>(String.CASE_INSENSITIVE_ORDER);
        brands.addAll(productRepository.findBrandsByCategory(category.trim()));
        return List.copyOf(brands);
    }

    public Page<Product> getAllActiveProducts(int page, int size) {
        return productRepository.findByIsActiveTrue(PageRequest.of(page, size));
    }

    public Page<Product> searchAndFilterProducts(String keyword, String category, String sortParam, int page, int size) {
        return browse(keyword, category, sortParam, page, size, null, null, null, false, null, false);
    }

    public Page<Product> browse(String keyword, String category, String sortParam, int page, int size,
            java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String brand, boolean inStock,
            Double minRating, boolean admin) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("Page must be nonnegative and size must be between 1 and 100");
        if ((minPrice != null && minPrice.signum() < 0) || (maxPrice != null && maxPrice.signum() < 0)
                || (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0))
            throw new IllegalArgumentException("Invalid price range");
        if (minRating != null && (!Double.isFinite(minRating) || minRating < 0 || minRating > 5)) throw new IllegalArgumentException("Rating must be between 0 and 5");
        String option = sortParam == null || sortParam.isBlank() ? "newest" : sortParam;
        Sort sort = switch (option) {
            case "price_asc" -> Sort.by("price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "rating" -> Sort.by(Sort.Direction.DESC, "averageRating", "reviewCount");
            case "name_asc" -> Sort.by("name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> throw new IllegalArgumentException("Unsupported sort option");
        };
        org.springframework.data.jpa.domain.Specification<Product> spec = (product, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (!admin) predicates.add(cb.isTrue(product.get("isActive")));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase(java.util.Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicates.add(cb.or(cb.like(cb.lower(product.get("name")), pattern, '\\'),
                        cb.like(cb.lower(product.get("description")), pattern, '\\'),
                        cb.like(cb.lower(product.get("brand")), pattern, '\\'),
                        cb.like(cb.lower(product.get("sku")), pattern, '\\')));
            }
            if (category != null && !category.isBlank()) predicates.add(cb.equal(cb.lower(product.get("category").get("name")), category.trim().toLowerCase(java.util.Locale.ROOT)));
            if (brand != null && !brand.isBlank()) predicates.add(cb.equal(cb.lower(product.get("brand")), brand.trim().toLowerCase(java.util.Locale.ROOT)));
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(product.get("price"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(product.get("price"), maxPrice));
            if (inStock) predicates.add(cb.greaterThan(product.get("availableStock"), 0));
            if (minRating != null) predicates.add(cb.greaterThanOrEqualTo(product.get("averageRating"), minRating));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var pageable = PageRequest.of(page, size, sort.and(Sort.by("id")));
        Page<Product> result = productRepository.findAll(spec, pageable);
        if (page > 0 && page >= result.getTotalPages())
            result = productRepository.findAll(spec, PageRequest.of(Math.max(0, result.getTotalPages() - 1), size, pageable.getSort()));
        return result;
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

    public Product createProduct(ProductRequest request, String actorEmail) {
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

        Product saved = productRepository.save(product);
        if (auditService != null) {
            auditService.log(actorEmail, "PRODUCT_CREATED", "PRODUCT", saved.getId(),
                    "Created product '" + saved.getName() + "' SKU=" + saved.getSku()
                            + " price=" + saved.getPrice() + " stock=" + saved.getAvailableStock());
        }
        return saved;
    }

    /** @deprecated Use {@link #createProduct(ProductRequest, String)} with actorEmail. */
    @Deprecated
    public Product createProduct(ProductRequest request) {
        return createProduct(request, "SYSTEM");
    }

    public Product updateProduct(Long id, ProductRequest request, String actorEmail) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());

        // Audit price change
        if (request.price() != null && !request.price().equals(product.getPrice())) {
            BigDecimal oldPrice = product.getPrice();
            product.setPrice(request.price());
            if (auditService != null) {
                auditService.log(actorEmail, "PRICE_CHANGE", "PRODUCT", product.getId(),
                        "Price changed for '" + product.getName() + "': " + oldPrice + " -> " + request.price());
            }
        }

        // Audit stock adjustment
        if (request.availableStock() != null && !request.availableStock().equals(product.getAvailableStock())) {
            int oldStock = product.getAvailableStock();
            product.setAvailableStock(request.availableStock());
            if (auditService != null) {
                auditService.log(actorEmail, "STOCK_ADJUSTMENT", "PRODUCT", product.getId(),
                        "Stock adjusted for '" + product.getName() + "': " + oldStock + " -> " + request.availableStock());
            }
        }

        if (request.imageUrls() != null) product.setImageUrls(request.imageUrls());
        if (request.tags() != null) product.setTags(request.tags());
        if (request.isActive() != null) product.setIsActive(request.isActive());
        if (request.sku() != null) product.setSku(request.sku());

        return productRepository.save(product);
    }

    /** @deprecated Use {@link #updateProduct(Long, ProductRequest, String)} with actorEmail. */
    @Deprecated
    public Product updateProduct(Long id, ProductRequest request) {
        return updateProduct(id, request, "SYSTEM");
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

    // ── Recommendations ────────────────────────────────────────────────────────

    public List<Product> getRecommendedProducts(String userEmail, int limit) {
        List<Product> recommendations = new ArrayList<>();

        // 1. Personalized Recommendations (if user is authenticated)
        if (userEmail != null && userRepository != null && orderRepository != null && cartRepository != null) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                Set<Long> favoriteCategoryIds = new HashSet<>();
                favoriteCategoryIds.addAll(orderRepository.findUserPurchasedCategoryIds(user.getId()));
                favoriteCategoryIds.addAll(cartRepository.findUserCartCategoryIds(user.getId()));

                if (!favoriteCategoryIds.isEmpty()) {
                    int personalizedLimit = limit / 2; // 50% personalized
                    recommendations.addAll(productRepository.findTopProductsByCategories(
                            new ArrayList<>(favoriteCategoryIds), PageRequest.of(0, personalizedLimit)).getContent());
                }
            });
        }

        // 2. Trending Products (Last 30 days)
        int remainingLimit = limit - recommendations.size();
        if (remainingLimit > 0 && orderItemRepository != null) {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            List<Long> topSellingIds = orderItemRepository.findTopSellingProductIds(thirtyDaysAgo, PageRequest.of(0, remainingLimit * 2));

            Map<Long, Product> productMap = productRepository.findAllById(topSellingIds).stream()
                    .filter(Product::getIsActive)
                    .collect(Collectors.toMap(Product::getId, p -> p));

            List<Product> trendingProducts = new ArrayList<>();
            for (Long id : topSellingIds) {
                if (productMap.containsKey(id)) {
                    trendingProducts.add(productMap.get(id));
                }
            }

            recommendations.addAll(trendingProducts);
        }

        // 3. Fallback: If still under limit, fill with highest-rated and newest active products
        if (recommendations.size() < limit) {
            Page<Product> fallbackPage = productRepository.findByIsActiveTrue(
                    PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "averageRating", "createdAt"))
            );
            if (fallbackPage != null && fallbackPage.getContent() != null) {
                for (Product p : fallbackPage.getContent()) {
                    if (!recommendations.contains(p)) {
                        recommendations.add(p);
                    }
                    if (recommendations.size() >= limit) break;
                }
            }
        }

        // Return exactly 'limit' distinct products
        return recommendations.stream().distinct().limit(limit).collect(Collectors.toList());
    }

    public List<Product> getFeaturedProducts(int limit) {
        List<Product> featured = new ArrayList<>();

        if (orderItemRepository != null) {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            List<Long> topSellingIds = orderItemRepository.findTopSellingProductIds(thirtyDaysAgo, PageRequest.of(0, limit * 2));

            if (!topSellingIds.isEmpty()) {
                Map<Long, Product> productMap = productRepository.findAllById(topSellingIds).stream()
                        .filter(Product::getIsActive)
                        .collect(Collectors.toMap(Product::getId, p -> p));

                for (Long id : topSellingIds) {
                    if (productMap.containsKey(id)) {
                        featured.add(productMap.get(id));
                    }
                }
            }
        }

        // Fallback: If not enough sales records, backfill with top-rated active products
        if (featured.size() < limit) {
            Page<Product> fallbackPage = productRepository.findByIsActiveTrue(
                    PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "averageRating", "createdAt"))
            );
            if (fallbackPage != null && fallbackPage.getContent() != null) {
                for (Product p : fallbackPage.getContent()) {
                    if (!featured.contains(p)) {
                        featured.add(p);
                    }
                    if (featured.size() >= limit) break;
                }
            }
        }

        return featured.stream().distinct().limit(limit).collect(Collectors.toList());
    }

    public List<Product> getLatestProducts(int limit) {
        return productRepository.findByIsActiveTrue(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }

    public List<Product> getSimilarProducts(Long productId, String userEmail, int limit) {
        Product currentProduct = productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new RuntimeException("Product not found or inactive"));

        List<Product> similar = new ArrayList<>(productRepository.findSimilarProductsByCategory(
                currentProduct.getCategory().getId(), productId, PageRequest.of(0, limit * 2)
        ).getContent());

        // Supplement with customer recommendations if available
        if (similar.size() < limit) {
            List<Product> personalized = getRecommendedProducts(userEmail, limit);
            for (Product p : personalized) {
                if (!similar.contains(p) && !p.getId().equals(productId)) {
                    similar.add(p);
                }
                if (similar.size() >= limit) break;
            }
        }

        return similar.stream().distinct().limit(limit).collect(Collectors.toList());
    }

    public List<Product> getCartSuggestions(List<Long> cartProductIds, String userEmail, int limit) {
        List<Long> safeCartIds = cartProductIds != null ? cartProductIds : List.of();
        List<Product> suggestions = new ArrayList<>();

        if (!safeCartIds.isEmpty()) {
            // Find categories for items currently in cart
            Set<Long> cartCategoryIds = productRepository.findAllById(safeCartIds).stream()
                    .map(p -> p.getCategory().getId())
                    .collect(Collectors.toSet());

            if (!cartCategoryIds.isEmpty()) {
                List<Product> categoryProducts = productRepository.findTopProductsByCategories(
                        new ArrayList<>(cartCategoryIds), PageRequest.of(0, limit * 2)
                ).getContent();

                for (Product p : categoryProducts) {
                    if (!safeCartIds.contains(p.getId())) {
                        suggestions.add(p);
                    }
                }
            }
        }

        // If cart is empty or still under limit, backfill with user personalized / trending recommendations
        if (suggestions.size() < limit) {
            List<Product> fallbackRecommendations = getRecommendedProducts(userEmail, limit * 2);
            for (Product p : fallbackRecommendations) {
                if (!safeCartIds.contains(p.getId()) && !suggestions.contains(p)) {
                    suggestions.add(p);
                }
                if (suggestions.size() >= limit) break;
            }
        }

        return suggestions.stream().distinct().limit(limit).collect(Collectors.toList());
    }
}
