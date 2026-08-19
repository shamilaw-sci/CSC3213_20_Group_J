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
            User admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("iCrowd");
            admin.setEmail("admin@icrowd.com");
            admin.setPassword(passwordEncoder.encode("Admin@1234"));
            admin.setPhone("0000000000");
            admin.setAddress("Admin HQ");
            admin.setDistrict("Admin District");
            admin.setCity("Colombo");
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("✅ Default admin created: admin@icrowd.com / Admin@1234");
        }
    }
}
