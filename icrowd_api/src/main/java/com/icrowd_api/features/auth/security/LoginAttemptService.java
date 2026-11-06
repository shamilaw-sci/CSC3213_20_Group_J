package com.icrowd_api.features.auth.security;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final int MAX_IP_ATTEMPTS = 10;
    public static final int LOCK_TIME_DURATION = 10; // minutes
    private static final int MAX_CACHE_ENTRIES = 5000;

    private final ConcurrentHashMap<String, Integer> attemptsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> lockCache = new ConcurrentHashMap<>();

    // ── Single-key API (retained for backward compatibility and email-keyed testing) ──

    public void loginSucceeded(String key) {
        if (key == null) return;
        String normalizedKey = key.trim().toLowerCase();
        attemptsCache.remove(normalizedKey);
        lockCache.remove(normalizedKey);
    }

    public void loginFailed(String key) {
        if (key == null) return;
        recordFailure(key.trim().toLowerCase(), MAX_ATTEMPTS);
    }

    public boolean isBlocked(String key) {
        if (key == null) return false;
        return checkLocked(key.trim().toLowerCase());
    }

    // ── Multi-signal API (combining network IP and account email signals) ────────────

    /**
     * Checks whether either the client IP is rate-limited or the (IP + email) account
     * attempt has exceeded the threshold.
     */
    public boolean isBlocked(String ip, String email) {
        if (ip != null && checkLocked("ip:" + ip.trim())) {
            return true;
        }
        if (email != null && checkLocked(email.trim().toLowerCase())) {
            return true;
        }
        return false;
    }

    public void loginFailed(String ip, String email) {
        cleanCacheIfFull();
        if (ip != null && !ip.isBlank()) {
            recordFailure("ip:" + ip.trim(), MAX_IP_ATTEMPTS);
        }
        if (email != null && !email.isBlank()) {
            recordFailure(email.trim().toLowerCase(), MAX_ATTEMPTS);
        }
    }

    public void loginSucceeded(String ip, String email) {
        if (email != null && !email.isBlank()) {
            loginSucceeded(email.trim().toLowerCase());
        }
        if (ip != null && !ip.isBlank()) {
            loginSucceeded("ip:" + ip.trim());
        }
    }

    // ── Internal Helpers ────────────────────────────────────────────────────────────

    private void recordFailure(String key, int maxAllowed) {
        cleanCacheIfFull();
        int attempts = attemptsCache.getOrDefault(key, 0) + 1;
        attemptsCache.put(key, attempts);
        if (attempts >= maxAllowed) {
            lockCache.put(key, LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION));
        }
    }

    private boolean checkLocked(String key) {
        LocalDateTime lockTime = lockCache.get(key);
        if (lockTime != null) {
            if (lockTime.isBefore(LocalDateTime.now())) {
                lockCache.remove(key);
                attemptsCache.remove(key);
                return false;
            }
            return true;
        }
        return false;
    }

    private void cleanCacheIfFull() {
        if (lockCache.size() > MAX_CACHE_ENTRIES || attemptsCache.size() > MAX_CACHE_ENTRIES) {
            LocalDateTime now = LocalDateTime.now();
            lockCache.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
            if (attemptsCache.size() > MAX_CACHE_ENTRIES) {
                attemptsCache.clear();
            }
        }
    }
}
