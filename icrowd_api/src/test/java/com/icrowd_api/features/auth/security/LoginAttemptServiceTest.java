package com.icrowd_api.features.auth.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptServiceTest {

    @Test
    void nullKeysAreIgnored() {
        LoginAttemptService service = new LoginAttemptService();

        service.loginFailed(null);
        service.loginSucceeded(null);

        assertFalse(service.isBlocked(null));
    }

    @Test
    void blocksNormalizedKeyAfterMaximumFailedAttempts() {
        LoginAttemptService service = new LoginAttemptService();

        for (int attempt = 0; attempt < LoginAttemptService.MAX_ATTEMPTS; attempt++) {
            service.loginFailed("  Buyer@Example.com ");
        }

        assertTrue(service.isBlocked("buyer@example.com"));
    }

    @Test
    void successfulLoginClearsFailuresAndLock() {
        LoginAttemptService service = new LoginAttemptService();

        for (int attempt = 0; attempt < LoginAttemptService.MAX_ATTEMPTS; attempt++) {
            service.loginFailed("buyer@example.com");
        }
        assertTrue(service.isBlocked("BUYER@example.com"));

        service.loginSucceeded(" BUYER@example.com ");

        assertFalse(service.isBlocked("buyer@example.com"));
    }

    @Test
    void keyIsNotBlockedBeforeMaximumFailedAttempts() {
        LoginAttemptService service = new LoginAttemptService();

        for (int attempt = 0; attempt < LoginAttemptService.MAX_ATTEMPTS - 1; attempt++) {
            service.loginFailed("buyer@example.com");
        }

        assertFalse(service.isBlocked("buyer@example.com"));
    }
}
