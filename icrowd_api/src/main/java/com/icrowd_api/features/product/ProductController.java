package com.icrowd_api.features.product;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:5173", "${cors.allowed.origins:http://localhost:5173}"})
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ── Public (Customer-facing) ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String brand,
            @RequestParam(defaultValue = "false") boolean inStock,
            @RequestParam(required = false) Double minRating) {
        return ResponseEntity.ok(productService.browse(keyword, category, sort, page, size, minPrice, maxPrice, brand, inStock, minRating, false));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getProductById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<SuggestionResponse> getSuggestions(@RequestParam String q) {
        return ResponseEntity.ok(productService.getSearchSuggestions(q));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Product>> getRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getRecommendedProducts(resolveUserEmail(authentication), limit));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<Product>> getFeatured(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getFeaturedProducts(limit));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Product>> getLatest(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getLatestProducts(limit));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<Product>> getSimilar(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getSimilarProducts(id, resolveUserEmail(authentication), limit));
    }

    @GetMapping("/cart-suggestions")
    public ResponseEntity<List<Product>> getCartSuggestions(
            @RequestParam(required = false) List<Long> productIds,
            Authentication authentication,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getCartSuggestions(productIds, resolveUserEmail(authentication), limit));
    }

    private String resolveUserEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return null;
    }


    // ── Admin CRUD ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Product>> getAllProductsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(productService.browse(keyword, null, "newest", page, size, null, null, null, false, null, true));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        return ResponseEntity.ok(productService.getDashboardStats());
    }

    @GetMapping("/admin/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Product>> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(productService.getLowStockProducts(threshold));
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Product>> getRecentProducts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(productService.getRecentProducts(limit));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> getProductByIdForAdmin(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getProductByIdForAdmin(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request) {
        try {
            Product created = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        try {
            Product updated = productService.updateProduct(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.softDeleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deactivated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
