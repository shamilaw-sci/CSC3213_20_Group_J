package com.icrowd_api.features.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default admin account if none exists
        if (!userRepository.existsByRole("ADMIN")) {

            // 1. Build the Admin profile (firstName, lastName, phone live here now)
            Admin adminProfile = Admin.builder()
                    .firstName("Admin")
                    .lastName("iCrowd")
                    .phone("0000000000")
                    .build();

            // 2. Build the User (email, password, role) and attach the Admin profile
            User user = User.builder()
                    .email("admin@icrowd.com")
                    .password(passwordEncoder.encode("Admin@1234"))
                    .role("ADMIN")
                    .accountStatus("ACTIVE")
                    .admin(adminProfile)
                    .build();

            // 3. Wire back-reference (Admin → User) so the FK is set correctly
            adminProfile.setUser(user);

            userRepository.save(user); // CascadeType.ALL saves Admin automatically
            System.out.println("✅ Default admin created: admin@icrowd.com / Admin@1234");
        }
    }
}
