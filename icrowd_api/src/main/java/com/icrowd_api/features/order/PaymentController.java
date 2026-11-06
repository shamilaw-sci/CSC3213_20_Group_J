package com.icrowd_api.features.order;

import com.icrowd_api.features.order.dto.InitiatePaymentRequest;
import com.icrowd_api.features.order.dto.InitiatePaymentResponse;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * Phase 5: Initiate payment attempt and get gateway checkout URL.
     * Authenticated endpoint.
     */
    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(Authentication authentication,
                                              @Valid @RequestBody InitiatePaymentRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED", "message", "Customer must be authenticated."));
        }

        try {
            String email = authentication.getName();
            InitiatePaymentResponse response = paymentService.initiatePayment(email, request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "INVALID_ORDER_STATE", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "ERROR", "message", e.getMessage()));
        }
    }

    /**
     * Phase 6: Gateway transaction notification / webhook endpoint.
     * Public endpoint receiving signed PayHere notifications.
     */
    @PostMapping(value="/notify", consumes="application/x-www-form-urlencoded")
    public ResponseEntity<?> notifyPayment(@RequestParam Map<String, String> notification) {
        try {
            paymentService.processNotification(notification);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Notification processed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_NOTIFICATION"));
        } catch (Exception e) {
            System.err.println("Error processing payment notification: " + e.getMessage());
            // A temporary processing failure must be retried.
            return ResponseEntity.status(503).body(Map.of("status", "RETRY", "message", "Payment verification is pending"));
        }
    }
}
