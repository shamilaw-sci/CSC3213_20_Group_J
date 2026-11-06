package com.icrowd_api.features.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Seeds demonstration accounts for development and test environments.
 * Restricted to non-production profiles (@Profile("!prod")).
 */
@Component
@Profile("!prod")
public class AdminDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.email:admin@icrowd.com}")
    private String defaultAdminEmail;

    @Value("${app.default-admin.password:Admin@1234}")
    private String defaultAdminPassword;

    @Value("${app.default-customer.email:customer@icrowd.com}")
    private String defaultCustomerEmail;

    @Value("${app.default-customer.password:Customer@1234}")
    private String defaultCustomerPassword;

    @Override
    public void run(String... args) throws Exception {
        // 1. Create default admin account if none exists
        if (!userRepository.existsByRole("ADMIN")) {
            Admin adminProfile = Admin.builder()
                    .firstName("Admin")
                    .lastName("iCrowd")
                    .phone("0770000000")
                    .build();

            User adminUser = User.builder()
                    .email(defaultAdminEmail)
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .role("ADMIN")
                    .accountStatus("ACTIVE")
                    .tokenVersion(1L)
                    .admin(adminProfile)
                    .build();

            adminProfile.setUser(adminUser);

            userRepository.save(adminUser); // CascadeType.ALL saves Admin automatically
            System.out.println("✅ Initialized default admin account for: " + defaultAdminEmail);
        }

        // 2. Create default customer account if none exists
        if (!userRepository.existsByEmail(defaultCustomerEmail)) {
            Customer customerProfile = Customer.builder()
                    .firstName("Kamal")
                    .lastName("Perera")
                    .phone("0771234567")
                    .dateOfBirth(LocalDate.of(1995, 5, 15))
                    .profileImage("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80")
                    .build();

            User customerUser = User.builder()
                    .email(defaultCustomerEmail)
                    .password(passwordEncoder.encode(defaultCustomerPassword))
                    .role("CUSTOMER")
                    .accountStatus("ACTIVE")
                    .tokenVersion(1L)
                    .customer(customerProfile)
                    .build();

            customerProfile.setUser(customerUser);

            Address address1 = Address.builder()
                    .customer(customerProfile)
                    .recipientName("Kamal Perera")
                    .phone("0771234567")
                    .addressLine1("123, Galle Road")
                    .addressLine2("Kollupitiya")
                    .city("Colombo 03")
                    .district("Colombo")
                    .province("Western Province")
                    .postalCode("00300")
                    .country("Sri Lanka")
                    .addressType("HOME")
                    .isDefault(true)
                    .build();

            Address address2 = Address.builder()
                    .customer(customerProfile)
                    .recipientName("Kamal Perera (Office)")
                    .phone("0771234567")
                    .addressLine1("No 45, Temple Road")
                    .addressLine2("Level 3")
                    .city("Kandy")
                    .district("Kandy")
                    .province("Central Province")
                    .postalCode("20000")
                    .country("Sri Lanka")
                    .addressType("WORK")
                    .isDefault(false)
                    .build();

            customerProfile.getAddresses().add(address1);
            customerProfile.getAddresses().add(address2);

            userRepository.save(customerUser); // CascadeType.ALL saves Customer and Addresses
            System.out.println("✅ Initialized default customer account for: " + defaultCustomerEmail);
        }
    }
}
