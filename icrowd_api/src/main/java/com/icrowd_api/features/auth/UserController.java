package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.auth.dto.ChangePasswordRequest;
import com.icrowd_api.features.auth.dto.UpdateProfileRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        Optional<UserProfileResponse> profile = userService.getUserProfile(email);

        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        }

        return ResponseEntity.status(404).body(Map.of("message", "User not found"));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            UserProfileResponse updated = userService.updateUserProfile(email, request);
            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "user", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        boolean success = userService.changePassword(email, request);

        if (success) {
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password does not match"));
        }
    }

    // ==========================================
    // Address Management REST Endpoints
    // ==========================================

    @GetMapping("/addresses")
    public ResponseEntity<?> getAddresses(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            List<AddressDto> addresses = userService.getCustomerAddresses(email);
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/addresses")
    public ResponseEntity<?> addAddress(
            Authentication authentication,
            @Valid @RequestBody AddressDto addressDto
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            AddressDto created = userService.addCustomerAddress(email, addressDto);
            return ResponseEntity.ok(Map.of(
                    "message", "Address added successfully",
                    "address", created
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<?> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AddressDto addressDto
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            AddressDto updated = userService.updateCustomerAddress(email, id, addressDto);
            return ResponseEntity.ok(Map.of(
                    "message", "Address updated successfully",
                    "address", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(
            Authentication authentication,
            @PathVariable Long id
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            userService.deleteCustomerAddress(email, id);
            return ResponseEntity.ok(Map.of("message", "Address deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/addresses/{id}/default")
    public ResponseEntity<?> setDefaultAddressPatch(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return setDefaultAddress(authentication, id);
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<?> setDefaultAddress(
            Authentication authentication,
            @PathVariable Long id
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            AddressDto updated = userService.setDefaultCustomerAddress(email, id);
            return ResponseEntity.ok(Map.of(
                    "message", "Default address updated successfully",
                    "address", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
