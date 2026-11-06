package com.icrowd_api.features.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final String DEFAULT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @Value("${jwt.secret:" + DEFAULT_SECRET + "}")
    private String secretKeyString;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtTokenValidity = 24 * 60 * 60 * 1000; // 24 hours default

    private SecretKey secretKey = Keys.hmacShaKeyFor(DEFAULT_SECRET.getBytes(StandardCharsets.UTF_8));

    @PostConstruct
    public void init() {
        byte[] keyBytes = DEFAULT_SECRET.getBytes(StandardCharsets.UTF_8);
        if (secretKeyString != null && !secretKeyString.isBlank()) {
            keyBytes = secretKeyString.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                try {
                    MessageDigest md = MessageDigest.getInstance("SHA-256");
                    keyBytes = md.digest(keyBytes);
                } catch (NoSuchAlgorithmException ignored) {
                    keyBytes = DEFAULT_SECRET.getBytes(StandardCharsets.UTF_8);
                }
            }
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.getSubject());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, claims -> claims.getExpiration());
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public Long extractTokenVersion(String token) {
        return extractClaim(token, claims -> {
            Object val = claims.get("tokenVersion");
            if (val instanceof Number) {
                return ((Number) val).longValue();
            }
            return null;
        });
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Legacy overload for compatibility
    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, "USER", 1L);
    }

    public String generateToken(UserDetails userDetails, String role) {
        return generateToken(userDetails, role, 1L);
    }

    public String generateToken(UserDetails userDetails, String role, Long tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("tokenVersion", tokenVersion != null ? tokenVersion : 1L);
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtTokenValidity))
                .signWith(secretKey)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
