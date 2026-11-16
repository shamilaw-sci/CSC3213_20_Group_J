package com.icrowd_api.features.order;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class OrderHistoryController {
    private final OrderRepository orders;
    public OrderHistoryController(OrderRepository orders) { this.orders = orders; }
    public record Item(Long productId, String name, int quantity, BigDecimal price) {}
    public record History(Long id, String reference, LocalDateTime createdAt, OrderStatus status,
                          PaymentStatus paymentStatus, PaymentMethod paymentMethod, BigDecimal total,
                          String address, String district, List<Item> items) {}
    @GetMapping("/api/orders")
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<History> history(Authentication authentication, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return orders.findByUserEmailOrderByCreatedAtDesc(authentication.getName(),org.springframework.data.domain.PageRequest.of(Math.max(0,page),Math.max(1,Math.min(50,size)))).map(order ->
            new History(order.getId(), order.getOrderReference(), order.getCreatedAt(), order.getStatus(),
                order.getPaymentStatus(), order.getPaymentMethod(), order.getTotalAmount(), order.getShippingAddress(),
                order.getShippingDistrict(), order.getItems().stream().map(item -> new Item(item.getProduct().getId(),
                    item.getProduct().getName(), item.getQuantity(), item.getPriceAtTimeOfPurchase())).toList())
        );
    }
}
