package com.icrowd_api.features.auth.security;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final int LOCK_TIME_DURATION = 10; // minutes

    private final ConcurrentHashMap<String, Integer> attemptsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> lockCache = new ConcurrentHashMap<>();

    public void loginSucceeded(String key) {
        if (key == null) return;
        String normalizedKey = key.trim().toLowerCase();
        attemptsCache.remove(normalizedKey);
        lockCache.remove(normalizedKey);
    }

    public void loginFailed(String key) {
        if (key == null) return;
        String normalizedKey = key.trim().toLowerCase();
        int attempts = attemptsCache.getOrDefault(normalizedKey, 0);
        attempts++;
        attemptsCache.put(normalizedKey, attempts);
        if (attempts >= MAX_ATTEMPTS) {
            lockCache.put(normalizedKey, LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION));
        }
    }

    public boolean isBlocked(String key) {
        if (key == null) return false;
        String normalizedKey = key.trim().toLowerCase();
        if (lockCache.containsKey(normalizedKey)) {
            LocalDateTime lockTime = lockCache.get(normalizedKey);
            if (lockTime.isBefore(LocalDateTime.now())) {
                // Lock expired
                lockCache.remove(normalizedKey);
                attemptsCache.remove(normalizedKey);
                return false;
            }
            return true; // Still locked
        }
        return false;
    }
}
