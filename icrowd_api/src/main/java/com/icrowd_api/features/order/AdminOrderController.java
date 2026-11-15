package com.icrowd_api.features.order;

import com.icrowd_api.features.order.dto.AdminOrderStatusUpdateRequest;
import com.icrowd_api.features.order.dto.AdminOrderSummaryDto;
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
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    @Autowired
    private OrderService orderService;

    /**
     * Get paginated orders for admin with optional search (ref, customer name, phone, email)
     * and status filter.
     */
    @GetMapping
    public ResponseEntity<Page<AdminOrderSummaryDto>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status) {

        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size)), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminOrderSummaryDto> orders = orderService.getOrdersForAdmin(pageRequest, search, status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get single order details for admin.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetailsForAdmin(id));
    }

    /**
     * Update order fulfillment status (where the order is now: CONFIRMED, PROCESSING, SHIPPED, DELIVERED, etc.)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.updateOrderStatusByAdmin(id, request.getStatus(), authentication.getName(), request.getNote()));
    }

    /**
     * Order statistics for dashboard / metrics overview.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        return ResponseEntity.ok(orderService.getOrderDashboardStats());
    }
}
