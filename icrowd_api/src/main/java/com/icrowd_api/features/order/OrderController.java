package com.icrowd_api.features.order;

import com.icrowd_api.features.order.dto.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping("/{id}/switch-to-cod")
    public ResponseEntity<?> switchToCod(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(orderService.switchToCod(authentication.getName(), id));
        } catch (OutOfStockException e) {
            return ResponseEntity.status(409).body(Map.of("error", "OUT_OF_STOCK", "productId", e.getProductId(),
                    "productName", e.getProductName(), "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Phase 4: Order Creation endpoint.
     * Receives shipping details, delivery method, and selected payment method.
     * Recalculates order amounts using trusted DB prices and reserves stock atomically.
     * For COD: sets CONFIRMED & DUE_ON_DELIVERY.
     * For CARD: sets PENDING_PAYMENT & PENDING.
     */
    @PostMapping
    public ResponseEntity<?> createOrder(Authentication authentication,
                                          @Valid @RequestBody CreateOrderRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED", "message", "User must be authenticated."));
        }

        try {
            String email = authentication.getName();
            CreateOrderResponse response = orderService.createNewOrder(email, request);
            return ResponseEntity.ok(response);
        } catch (OutOfStockException e) {
            return ResponseEntity.status(409).body(
                Map.of(
                    "error", "OUT_OF_STOCK",
                    "productId", e.getProductId() != null ? e.getProductId() : 0L,
                    "productName", e.getProductName() != null ? e.getProductName() : "",
                    "message", e.getMessage() != null ? e.getMessage() : "Product is out of stock"
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "VALIDATION_FAILED", "message", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "ERROR", "message", e.getMessage() != null ? e.getMessage() : "Order creation failed")
            );
        }
    }

    /**
     * Phase 7: Order & Payment Status check endpoint.
     * Used by the frontend upon return from gateway or when polling.
     */
    @GetMapping("/{id}/payment-status")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED", "message", "User must be authenticated."));
        }

        try {
            String email = authentication.getName();
            PaymentStatusResponse response = orderService.getPaymentStatus(id, email);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "ERROR", "message", e.getMessage()));
        }
    }

    /**
     * Phase 1: Validate shipping information & quote pricing.
     * Does NOT create an order.
     */
    @PostMapping("/validate-shipping")
    public ResponseEntity<?> validateShipping(Authentication authentication, @Valid @RequestBody ShippingValidationRequest request) {
        try {
            String email = authentication != null ? authentication.getName() : null;
            ShippingValidationResponse response = orderService.validateShippingAndCalculate(email, request);
            return ResponseEntity.ok(response);
        } catch (OutOfStockException e) {
            return ResponseEntity.status(409).body(
                Map.of(
                    "error", "OUT_OF_STOCK",
                    "productId", e.getProductId() != null ? e.getProductId() : 0L,
                    "productName", e.getProductName() != null ? e.getProductName() : "",
                    "message", e.getMessage() != null ? e.getMessage() : "Product is out of stock"
                )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "VALIDATION_FAILED", "message", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "ERROR", "message", e.getMessage() != null ? e.getMessage() : "Validation failed")
            );
        }
    }

    /**
     * Legacy checkout endpoint for backward compatibility.
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(Authentication authentication, @RequestBody CheckoutRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        try {
            String email = authentication.getName();
            Order order = orderService.createOrder(email, request);
            return ResponseEntity.ok(order);
        } catch (OutOfStockException e) {
            return ResponseEntity.status(409).body(
                Map.of("error", "OUT_OF_STOCK", "productId", e.getProductId())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Upload a payment receipt for an order.
     * BOLA ownership check: only the order owner or an ADMIN may upload.
     */
    @PostMapping("/{id}/receipt")
    public ResponseEntity<?> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        // Ownership / ADMIN bypass check
        Order order = orderService.findById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        boolean isOwner = order.getUser() != null && order.getUser().getEmail() != null &&
                order.getUser().getEmail().equals(authentication.getName());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied: not your order"));
        }

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            int i = originalFileName.lastIndexOf('.');
            if (i > 0) {
                fileExtension = originalFileName.substring(i);
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + fileName;
            orderService.updateReceiptUrl(id, fileUrl);

            return ResponseEntity.ok(fileUrl);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Could not upload file: " + e.getMessage());
        }
    }
}
