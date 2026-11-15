package com.icrowd_api.features.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> conflict(Exception ex) {
        return ResponseEntity.status(409).body(Map.of("message","This record changed. Reload it before saving."));
    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("message", errorMessage));
    }

    /** Handles ResponseStatusException from services/controllers. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason() == null ? "Request failed" : ex.getReason()));
    }

    /** Handles business-rule violations (e.g. demoting last admin). */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("message",
                ex.getMessage() != null ? ex.getMessage() : "Business rule violation"));
    }

    /** Handles reauthentication failures. */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<?> handleSecurityException(SecurityException ex) {
        return ResponseEntity.status(403).body(Map.of("message",
                ex.getMessage() != null ? ex.getMessage() : "Access denied"));
    }

    /** Handles Spring Security method-level access denial. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(403).body(Map.of("message", "Access denied: insufficient permissions"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> invalidInput(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message",ex.getMessage()==null ? "Invalid request" : ex.getMessage()));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralExceptions(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Request failed: {}", ex.getClass().getSimpleName());
        return ResponseEntity.internalServerError().body(Map.of("message","The request could not be completed. Please try again."));
    }
}
