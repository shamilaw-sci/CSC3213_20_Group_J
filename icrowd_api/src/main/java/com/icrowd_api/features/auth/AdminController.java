package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.UserProfileResponse;
import com.icrowd_api.features.category.CategoryService;
import com.icrowd_api.features.product.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "${cors.allowed.origins:http://localhost:5173}"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    // ── User Management ────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        List<UserProfileResponse> users = userService.getAllUsers().stream()
                .map(UserProfileResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> {
                    user.setRole("ADMIN");
                    String result = userService.promoteToAdmin(user.getEmail());
                    return ResponseEntity.ok(Map.of("message", result));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable Long id) {
        String result = userService.demoteToUser(id);
        if (result.contains("successfully")) {
            return ResponseEntity.ok(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Dashboard overview ─────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Long> productStats = productService.getDashboardStats();
        Map<String, Object> dashboard = new java.util.HashMap<>(productStats);
        dashboard.put("totalCategories", categoryService.getTotalCount());
        dashboard.put("totalUsers", (long) userService.getAllUsers().size());
        dashboard.put("recentProducts", productService.getRecentProducts(5));
        dashboard.put("lowStockProducts", productService.getLowStockProducts(5));
        return ResponseEntity.ok(dashboard);
    }
}
