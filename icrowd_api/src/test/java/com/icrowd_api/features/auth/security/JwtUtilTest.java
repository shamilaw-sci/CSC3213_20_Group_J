package com.icrowd_api.features.auth.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil();
    private final UserDetails user = User.withUsername("buyer@example.com")
            .password("password")
            .roles("USER")
            .build();

    @org.junit.jupiter.api.BeforeEach void configureKey() { org.springframework.test.util.ReflectionTestUtils.setField(jwtUtil,"secretKeyString","test-only-unique-32-byte-signing-key-1234567890"); jwtUtil.init(); }

    @Test
    void generatedTokenContainsUsernameAndFutureExpiration() {
        String token = jwtUtil.generateToken(user);

        assertEquals(user.getUsername(), jwtUtil.extractUsername(token));
        Date expiration = jwtUtil.extractExpiration(token);
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    void validatesTokenForMatchingUser() {
        String token = jwtUtil.generateToken(user);

        assertTrue(jwtUtil.validateToken(token, user));
    }

    @Test
    void rejectsTokenForDifferentUser() {
        String token = jwtUtil.generateToken(user);
        UserDetails otherUser = User.withUsername("other@example.com")
                .password("password")
                .roles("USER")
                .build();

        assertFalse(jwtUtil.validateToken(token, otherUser));
    }

    @Test
    void tokenPreservesTokenVersionAndRole() {
        String token = jwtUtil.generateToken(user, "ADMIN", 5L);
        assertEquals(5L, jwtUtil.extractTokenVersion(token));
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }
}
