package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.RegisterRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.auth.security.LoginAttemptService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
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

    @Autowired(required = false)
    private HttpServletRequest httpRequest;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        String result = userService.registerUser(registerRequest);
        if (result.contains("successfully")) {
            return ResponseEntity.ok().body(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result));
    }

    /**
     * Protected endpoint exclusively for authorized administrators to create new Admin accounts.
     */
    @PostMapping("/register-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterRequest registerRequest) {
        String result = userService.registerAdmin(registerRequest);
        if (result.contains("successfully")) {
            return ResponseEntity.ok().body(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData != null ? loginData.get("email") : null;
        String password = loginData != null ? loginData.get("password") : null;
        String clientIp = getClientIp();

        if (loginAttemptService.isBlocked(clientIp, email)) {
            return ResponseEntity.status(401).body(Map.of("message", "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            loginAttemptService.loginSucceeded(clientIp, email);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            Optional<User> userOpt = userService.findByEmail(email);
            String role = (userOpt.isPresent() && userOpt.get().getRole() != null)
                    ? userOpt.get().getRole()
                    : "CUSTOMER";
            Long tokenVersion = (userOpt.isPresent() && userOpt.get().getTokenVersion() != null)
                    ? userOpt.get().getTokenVersion()
                    : 1L;

            String jwt = jwtUtil.generateToken(userDetails, role, tokenVersion);

            // Return richer UserProfileResponse so frontend gets firstName, lastName, etc.
            Optional<UserProfileResponse> userProfile = userService.getUserProfile(email);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", userProfile.orElse(null));

            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is suspended. Please contact support."));
        } catch (LockedException e) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is locked. Please try again later."));
        } catch (Exception e) {
            loginAttemptService.loginFailed(clientIp, email);
            if (loginAttemptService.isBlocked(clientIp, email)) {
                return ResponseEntity.status(401).body(Map.of("message", "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
            }
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password!"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            userService.invalidateTokens(authentication.getName());
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
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

    // ADMIN only: promote a user to ADMIN role
    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String result = userService.promoteToAdmin(email);
        if (result != null && result.contains("successfully")) {
            return ResponseEntity.ok(Map.of("message", result));
        }
        return ResponseEntity.badRequest().body(Map.of("message", result != null ? result : "Failed to promote user"));
    }

    private String getClientIp() {
        if (httpRequest == null) {
            return null;
        }
        String xf = httpRequest.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return httpRequest.getRemoteAddr();
    }
}
