package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.security.JwtUtil;
import com.icrowd_api.features.auth.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserService userService;

    @Mock
    private JwtUtil jwtUtil;

    private LoginAttemptService loginAttemptService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() throws Exception {
        loginAttemptService = new LoginAttemptService();
        
        // Inject LoginAttemptService
        java.lang.reflect.Field loginServiceField = AuthController.class.getDeclaredField("loginAttemptService");
        loginServiceField.setAccessible(true);
        loginServiceField.set(authController, loginAttemptService);
        
        // Inject AuthenticationManager
        java.lang.reflect.Field authManagerField = AuthController.class.getDeclaredField("authenticationManager");
        authManagerField.setAccessible(true);
        authManagerField.set(authController, authenticationManager);
        
        // Inject UserService
        java.lang.reflect.Field userServiceField = AuthController.class.getDeclaredField("userService");
        userServiceField.setAccessible(true);
        userServiceField.set(authController, userService);
        
        // Inject JwtUtil
        java.lang.reflect.Field jwtUtilField = AuthController.class.getDeclaredField("jwtUtil");
        jwtUtilField.setAccessible(true);
        jwtUtilField.set(authController, jwtUtil);
    }

    @Test
    void testFailedLoginAttemptTrackingAndLockout() {
        String email = "test@example.com";
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", "wrongpassword");

        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        for (int i = 0; i < 4; i++) {
            ResponseEntity<?> response = authController.loginUser(loginData);
            assertEquals(401, response.getStatusCode().value());
            Map<String, Object> body = (Map<String, Object>) response.getBody();
            assertEquals("Invalid email or password!", body.get("message"));
        }

        ResponseEntity<?> response = authController.loginUser(loginData);
        assertEquals(401, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Account is temporarily locked due to multiple failed login attempts. Please try again later.", body.get("message"));
    }

    @Test
    void testSuccessfulLoginResetsCounter() {
        String email = "test@example.com";
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", "password");

        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        for (int i = 0; i < 4; i++) {
            authController.loginUser(loginData);
        }

        Authentication authentication = Mockito.mock(Authentication.class);
        org.springframework.security.core.userdetails.UserDetails userDetails = Mockito.mock(org.springframework.security.core.userdetails.UserDetails.class);
        Mockito.when(authentication.getPrincipal()).thenReturn(userDetails);
        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        Mockito.when(jwtUtil.generateToken(userDetails)).thenReturn("mock-jwt-token");
        Mockito.when(userService.getUserProfile(email)).thenReturn(Optional.of(new com.icrowd_api.features.auth.dto.UserProfileResponse()));

        ResponseEntity<?> response = authController.loginUser(loginData);
        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body.get("token"));

        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> failResponse = authController.loginUser(loginData);
        assertEquals(401, failResponse.getStatusCode().value());
        Map<String, Object> failBody = (Map<String, Object>) failResponse.getBody();
        assertEquals("Invalid email or password!", failBody.get("message")); 
    }

    @Test
    void testLoginRejectedWhileLocked() {
        String email = "test@example.com";
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", "wrongpassword");

        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        for (int i = 0; i < 5; i++) {
            authController.loginUser(loginData);
        }

        loginData.put("password", "correctpassword");
        
        ResponseEntity<?> response = authController.loginUser(loginData);
        assertEquals(401, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Account is temporarily locked due to multiple failed login attempts. Please try again later.", body.get("message"));
    }

    @Test
    void testLoginWorkingAgainAfterLockoutPeriod() throws Exception {
        String email = "test@example.com";
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", "wrongpassword");

        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        for (int i = 0; i < 5; i++) {
            authController.loginUser(loginData);
        }

        java.lang.reflect.Field lockCacheField = LoginAttemptService.class.getDeclaredField("lockCache");
        lockCacheField.setAccessible(true);
        ConcurrentHashMap<String, LocalDateTime> lockCache = 
                (ConcurrentHashMap<String, LocalDateTime>) lockCacheField.get(loginAttemptService);
        
        lockCache.put(email, LocalDateTime.now().minusMinutes(1));

        ResponseEntity<?> response = authController.loginUser(loginData);
        assertEquals(401, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Invalid email or password!", body.get("message"));
    }
}
