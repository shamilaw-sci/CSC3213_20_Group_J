package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.UserProfileResponse;
import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.auth.security.LoginAttemptService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        String result = userService.registerUser(user);
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
            return ResponseEntity.status(401).body(Map.of("message", "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            loginAttemptService.loginSucceeded(email);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);

            Optional<User> user = userService.findByEmail(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", user.map(UserProfileResponse::fromUser).orElse(null));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            loginAttemptService.loginFailed(email);
            if (loginAttemptService.isBlocked(email)) {
                return ResponseEntity.status(401).body(Map.of("message", "Account is temporarily locked due to multiple failed login attempts. Please try again later."));
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
        Optional<User> user = userService.findByEmail(email);
        
        if (user.isPresent()) {
            return ResponseEntity.ok(UserProfileResponse.fromUser(user.get()));
        }
        
        return ResponseEntity.status(404).body(Map.of("message", "User not found"));
    }
}
