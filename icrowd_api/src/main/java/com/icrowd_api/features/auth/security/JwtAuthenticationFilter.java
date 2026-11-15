package com.icrowd_api.features.auth.security;

import com.icrowd_api.features.auth.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired private JwtUtil jwtUtil;
    @Autowired private CustomUserDetailsService customUserDetailsService;
    @Autowired private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                var claims = jwtUtil.extractAllClaims(header.substring(7));
                Object version = claims.get("tokenVersion");
                if (!(version instanceof Number) || claims.getSubject() == null || claims.getExpiration() == null) {
                    throw new IllegalArgumentException("Incomplete session");
                }
                var user = userRepository.findByEmail(claims.getSubject()).orElseThrow();
                if (user.getTokenVersion() == null || ((Number) version).longValue() != user.getTokenVersion()) {
                    throw new IllegalArgumentException("Expired session");
                }
                var details = customUserDetailsService.toUserDetails(user);
                if (!details.isEnabled() || !details.isAccountNonLocked()) {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"This account is not active.\"}");
                    return;
                }
                var authentication = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException invalidSession) {
                SecurityContextHolder.clearContext();
                response.setStatus(401);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Your session has expired. Please sign in again.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
