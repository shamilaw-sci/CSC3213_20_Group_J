package com.icrowd_api.features.product;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@org.springframework.transaction.annotation.Transactional(readOnly=true)
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ── Public (Customer-facing) ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<CatalogProduct>> getProducts(
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
        return ResponseEntity.ok(productService.browse(keyword, category, sort, page, size, minPrice, maxPrice, brand, inStock, minRating, false).map(CatalogProduct::summary));
    }

    @GetMapping("/brands")
    public ResponseEntity<List<String>> getBrands(@RequestParam String category) {
        return ResponseEntity.ok(productService.getBrands(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatalogProduct> getProductById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(CatalogProduct.detail(productService.getProductById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<SuggestionResponse> getSuggestions(@RequestParam String q) {
        return ResponseEntity.ok(productService.getSearchSuggestions(q));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<CatalogProduct>> getRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getRecommendedProducts(resolveUserEmail(authentication), limit).stream().map(CatalogProduct::summary).toList());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<CatalogProduct>> getFeatured(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getFeaturedProducts(limit).stream().map(CatalogProduct::summary).toList());
    }

    @GetMapping("/latest")
    public ResponseEntity<List<CatalogProduct>> getLatest(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getLatestProducts(limit).stream().map(CatalogProduct::summary).toList());
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<CatalogProduct>> getSimilar(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getSimilarProducts(id, resolveUserEmail(authentication), limit).stream().map(CatalogProduct::summary).toList());
    }

    @GetMapping("/cart-suggestions")
    public ResponseEntity<List<CatalogProduct>> getCartSuggestions(
            @RequestParam(required = false) List<Long> productIds,
            Authentication authentication,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(productService.getCartSuggestions(productIds, resolveUserEmail(authentication), limit).stream().map(CatalogProduct::summary).toList());
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
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<Page<AdminProductView>> getAllProductsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(productService.browse(keyword, null, "newest", page, size, null, null, null, false, null, true).map(AdminProductView::from));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        return ResponseEntity.ok(productService.getDashboardStats());
    }

    @GetMapping("/admin/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<List<Product>> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(productService.getLowStockProducts(threshold));
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<List<Product>> getRecentProducts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(productService.getRecentProducts(limit));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<AdminProductView> getProductByIdForAdmin(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(AdminProductView.from(productService.getProductByIdForAdmin(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request, Authentication authentication) {
        try {
            String actorEmail = authentication != null ? authentication.getName() : "SYSTEM";
            Product created = productService.createProduct(request, actorEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(AdminProductView.from(created));
        } catch (org.springframework.web.server.ResponseStatusException | org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<?> updateProduct(@PathVariable Long id,
                                           @RequestBody ProductRequest request,
                                           Authentication authentication) {
        try {
            String actorEmail = authentication != null ? authentication.getName() : "SYSTEM";
            Product updated = productService.updateProduct(id, request, actorEmail);
            return ResponseEntity.ok(AdminProductView.from(updated));
        } catch (org.springframework.web.server.ResponseStatusException | org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.softDeleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deactivated successfully"));
        } catch (org.springframework.web.server.ResponseStatusException | org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
