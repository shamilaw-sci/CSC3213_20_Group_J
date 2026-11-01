package com.icrowd_api.features.auth;

import com.icrowd_api.features.audit.AuditService;
import com.icrowd_api.features.auth.dto.RegisterRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.auth.security.LoginAttemptService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "${cors.allowed.origins:http://localhost:5173}"})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private AuditService auditService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        String result = userService.registerUser(registerRequest);
        if (result.contains("successfully")) {
            return ResponseEntity.ok().body(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        if (loginAttemptService.isBlocked(email)) {
            return ResponseEntity.status(401).body(Map.of("message",
                    "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            loginAttemptService.loginSucceeded(email);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            Optional<User> userOpt = userService.findByEmail(email);
            String role = userOpt.map(User::getRole).orElse("CUSTOMER");
            String jwt = jwtUtil.generateToken(userDetails, role);

            // Return richer UserProfileResponse so frontend gets firstName, lastName, etc.
            Optional<UserProfileResponse> userProfile = userService.getUserProfile(email);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", userProfile.orElse(null));

            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            // Account is DEACTIVATED (Spring Security disabled account)
            return ResponseEntity.status(403).body(Map.of("message",
                    "Your account has been deactivated. Please contact support."));
        } catch (Exception e) {
            loginAttemptService.loginFailed(email);
            if (loginAttemptService.isBlocked(email)) {
                return ResponseEntity.status(401).body(Map.of("message",
                        "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
            }
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password!"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        Optional<UserProfileResponse> profile = userService.getUserProfile(email);

        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        }

        return ResponseEntity.status(404).body(Map.of("message", "User not found"));
    }

    /**
     * ADMIN only: promote a user to ADMIN role.
     * Requires reauthentication: include {"email": "target@email.com", "password": "adminpass"}.
     */
    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String actorEmail = authentication.getName();
        String targetEmail = body.get("email");
        String confirmPassword = body.get("password");

        // Reauthentication guard
        if (confirmPassword == null || confirmPassword.isBlank()) {
            return ResponseEntity.status(403).body(Map.of("message",
                    "Password confirmation is required for this operation"));
        }
        try {
            userService.validateAdminPassword(actorEmail, confirmPassword);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }

        String result = userService.promoteToAdmin(targetEmail, actorEmail);
        if (result.contains("successfully")) {
            return ResponseEntity.ok(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result));
    }
}
