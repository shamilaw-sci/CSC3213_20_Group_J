package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.AdminUserSummaryDto;
import com.icrowd_api.features.auth.dto.ReauthRequest;
import com.icrowd_api.features.category.CategoryService;
import com.icrowd_api.features.order.OrderService;
import com.icrowd_api.features.product.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private OrderService orderService;

    // ── User Management ────────────────────────────────────────────────────────

    /**
     * Paginated user listing returning only fields needed by the admin screen.
     * Supports search by name/email and filter by role.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserSummaryDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminUserSummaryDto> users = userService.getUsersForAdmin(pageRequest, search, role);
        return ResponseEntity.ok(users);
    }

    /**
     * Promote a user to ADMIN. Requires reauthentication (admin's own password).
     * Creates the associated Admin profile if missing (profile consistency).
     */
    @PatchMapping("/users/{id}/promote")
    public ResponseEntity<?> promoteUser(
            @PathVariable Long id,
            @Valid @RequestBody ReauthRequest reauthRequest,
            Authentication authentication) {

        String actorEmail = authentication.getName();

        // Reauthentication guard
        try {
            userService.validateAdminPassword(actorEmail, reauthRequest.getPassword());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }

        return userService.findById(id)
                .map(user -> {
                    String result = userService.promoteToAdmin(user.getEmail(), actorEmail);
                    return ResponseEntity.ok(Map.of("message", result));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Demote an ADMIN to CUSTOMER. Protected against demoting the last active admin.
     * Creates the associated Customer profile if missing (profile consistency).
     */
    @PatchMapping("/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable Long id, Authentication authentication) {
        String actorEmail = authentication.getName();
        try {
            String result = userService.demoteToUser(id, actorEmail);
            if (result.contains("successfully")) {
                return ResponseEntity.ok(Map.of("message", result));
            }
            return ResponseEntity.badRequest().body(Map.of("message", result));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Deactivate a user account (controlled deactivation – order/audit history preserved).
     * Cannot deactivate the last active administrator.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id, Authentication authentication) {
        String actorEmail = authentication.getName();
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        try {
            userService.deactivateUser(id, actorEmail);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Reactivate a previously deactivated user account.
     */
    @PatchMapping("/users/{id}/reactivate")
    public ResponseEntity<?> reactivateUser(@PathVariable Long id, Authentication authentication) {
        String actorEmail = authentication.getName();
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        try {
            userService.reactivateUser(id, actorEmail);
            return ResponseEntity.ok(Map.of("message", "User reactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Dashboard overview ─────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        java.util.Map<String, Long> productStats = productService.getDashboardStats();
        java.util.Map<String, Object> dashboard = new java.util.HashMap<>(productStats);
        dashboard.put("totalCategories", categoryService.getTotalCount());
        dashboard.put("totalUsers", userService.countUsers());
        dashboard.put("recentProducts", productService.getRecentProducts(5));
        dashboard.put("lowStockProducts", productService.getLowStockProducts(5));
        if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            dashboard.putAll(orderService.getOrderDashboardStats());
        }
        return ResponseEntity.ok(dashboard);
    }
}
