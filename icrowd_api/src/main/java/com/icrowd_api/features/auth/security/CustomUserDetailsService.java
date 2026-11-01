package com.icrowd_api.features.auth.security;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Normalise role — developer branch uses CUSTOMER, HEAD used USER; support both
        String rawRole = user.getRole() != null ? user.getRole().toUpperCase() : "CUSTOMER";

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + rawRole));

        switch (rawRole) {
            case "ADMIN" -> {
                // Admin inherits inventory manager powers and all permissions
                authorities.add(new SimpleGrantedAuthority("ROLE_INVENTORY_MANAGER"));
                authorities.add(new SimpleGrantedAuthority("PERM_ACCOUNTS_MANAGE"));
                authorities.add(new SimpleGrantedAuthority("PERM_INVENTORY_MANAGE"));
                authorities.add(new SimpleGrantedAuthority("PERM_ANALYTICS_VIEW"));
            }
            case "INVENTORY_MANAGER" -> {
                // Inventory managers can only manage products/categories/stock
                authorities.add(new SimpleGrantedAuthority("PERM_INVENTORY_MANAGE"));
            }
            default -> {
                // CUSTOMER / USER — alias both so hasRole('CUSTOMER') and hasRole('USER') both work
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
            }
        }

        // Determine if account is enabled — only ACTIVE accounts can authenticate
        boolean enabled = "ACTIVE".equalsIgnoreCase(user.getAccountStatus());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                enabled,          // enabled
                true,             // accountNonExpired
                true,             // credentialsNonExpired
                true,             // accountNonLocked (lockout handled by LoginAttemptService)
                authorities
        );
    }
}
