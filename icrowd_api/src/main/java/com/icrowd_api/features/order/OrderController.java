package com.icrowd_api.features.order;

import com.icrowd_api.features.order.dto.CheckoutRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    private final String UPLOAD_DIR = "uploads/";

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
                java.util.Map.of("error", "OUT_OF_STOCK", "productId", e.getProductId())
            );
        } catch (Exception e) {
            // Very basic error handling for now
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/receipt")
    public ResponseEntity<?> uploadReceipt(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Create uploads directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            int i = originalFileName.lastIndexOf('.');
            if (i > 0) {
                fileExtension = originalFileName.substring(i);
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Construct URL (assuming default port 8080 for backend)
            // In a real app, you'd get the base URL from config or HttpServletRequest
            String fileUrl = "/uploads/" + fileName;

            // Update order
            orderService.updateReceiptUrl(id, fileUrl);

            return ResponseEntity.ok(fileUrl);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Could not upload file: " + e.getMessage());
        }
    }
}
