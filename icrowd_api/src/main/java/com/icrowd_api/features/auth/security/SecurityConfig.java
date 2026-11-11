package com.icrowd_api.features.auth.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                // Public auth endpoints
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                // Public AI Chatbot endpoints
                .requestMatchers("/api/ai/**").permitAll()
                // Public product read endpoints (customer store)
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/{id}", "/api/products/suggestions", "/api/products/recommendations", "/api/products/featured", "/api/products/latest", "/api/products/*/similar", "/api/products/cart-suggestions").permitAll()
                // Public category read endpoints (needed for dropdowns)
                .requestMatchers(HttpMethod.GET, "/api/storefront/hero", "/api/storefront/hero/image").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/{id}").permitAll()
                // Feedback rules must precede admin-only product writes.
                .requestMatchers(HttpMethod.GET, "/api/products/*/reviews", "/api/products/*/questions").permitAll()
                .requestMatchers("/api/products/*/reviews/**", "/api/products/*/questions/**").authenticated()
                // Public review reads
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                // Admin-only write operations on products
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/admin/**").hasRole("ADMIN")
                // Admin-only write operations on categories
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                // All /api/admin/** and /api/analytics/** require ADMIN role
                .requestMatchers("/api/admin/**", "/api/analytics/**").hasRole("ADMIN")
                // Auth/me and create-admin require authentication
                .requestMatchers("/api/auth/me", "/api/auth/create-admin").authenticated()
                // User profile and address endpoints require authentication
                .requestMatchers("/api/users/**").authenticated()
                // Cart and order endpoints require authentication
                .requestMatchers("/api/cart/**", "/api/orders/**").authenticated()
                // Gateway payment notification callback is public (server-to-server)
                .requestMatchers(HttpMethod.POST, "/api/payments/notify").permitAll()
                // All other payment endpoints require authentication
                .requestMatchers("/api/payments/**").authenticated()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // HEAD: localhost:5173 | developer: adds 127.0.0.1:5173 and localhost:3000
        configuration.setAllowedOrigins(java.util.stream.Stream.of(frontendUrl,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000"
        ).distinct().toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
