package com.icrowd_api.features.auth;

import com.icrowd_api.features.audit.AuditService;
import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.auth.dto.AdminUserSummaryDto;
import com.icrowd_api.features.auth.dto.ChangePasswordRequest;
import com.icrowd_api.features.auth.dto.RegisterRequest;
import com.icrowd_api.features.auth.dto.UpdateProfileRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Transactional
    public String registerUser(RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return "Email already exists!";
        }

        // Security: Public registration MUST ALWAYS assign CUSTOMER role
        String role = "CUSTOMER";

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .accountStatus("ACTIVE")
                .tokenVersion(1L)
                .build();

        Customer customer = Customer.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .profileImage(request.getProfileImage())
                .addresses(new ArrayList<>())
                .build();

        String addrLine1 = request.getAddressLine1() != null ? request.getAddressLine1() : request.getAddress();
        if (addrLine1 != null && !addrLine1.trim().isEmpty()) {
            Address address = Address.builder()
                    .customer(customer)
                    .recipientName((request.getFirstName() + " " + request.getLastName()).trim())
                    .phone(request.getPhone())
                    .addressLine1(addrLine1.trim())
                    .addressLine2(request.getAddressLine2())
                    .city(request.getCity() != null ? request.getCity().trim() : "Colombo")
                    .district(request.getDistrict())
                    .province(request.getProvince())
                    .postalCode(request.getPostalCode())
                    .country(request.getCountry() != null ? request.getCountry() : "Sri Lanka")
                    .addressType("HOME")
                    .isDefault(true)
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .build();

            customer.getAddresses().add(address);
        }

        user.setCustomer(customer);
        userRepository.save(user);
        return "User registered successfully!";
    }

    /**
     * Dedicated protected workflow for administrator creation.
     * Can only be called via authenticated admin-protected endpoints.
     */
    @Transactional
    public String registerAdmin(RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return "Email already exists!";
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ADMIN")
                .accountStatus("ACTIVE")
                .tokenVersion(1L)
                .build();

        Admin admin = Admin.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .build();
        user.setAdmin(admin);

        userRepository.save(user);
        return "Admin registered successfully!";
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Optional<UserProfileResponse> getUserProfile(String email) {
        return userRepository.findByEmail(email).map(UserProfileResponse::fromUser);
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    // ── Paginated user listing for admin ────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminUserSummaryDto> getUsersForAdmin(Pageable pageable, String search, String role) {
        return userRepository.searchUsersForAdmin(search, role, pageable)
                .map(AdminUserSummaryDto::fromUser);
    }

    // ── Reauthentication ────────────────────────────────────────────────────────

    /**
     * Validates the admin's password for reauthentication on sensitive operations.
     * @throws SecurityException if the password does not match.
     */
    public void validateAdminPassword(String adminEmail, String rawPassword) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));
        if (!passwordEncoder.matches(rawPassword, admin.getPassword())) {
            throw new SecurityException("Reauthentication failed: incorrect password");
        }
    }

    // ── Promotion with profile consistency ──────────────────────────────────────

    @Transactional
    public String promoteToAdmin(String email, String actorEmail) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "User not found with email: " + email;
        }
        User user = userOpt.get();
        if ("ADMIN".equals(user.getRole())) {
            return "User is already an ADMIN";
        }

        user.setRole("ADMIN");

        // Profile consistency: create Admin profile from Customer data if missing
        if (user.getAdmin() == null) {
            String firstName = "Unknown";
            String lastName = "User";
            String phone = null;

            if (user.getCustomer() != null) {
                firstName = user.getCustomer().getFirstName();
                lastName = user.getCustomer().getLastName();
                phone = user.getCustomer().getPhone();
            }

            Admin admin = Admin.builder()
                    .user(user)
                    .firstName(firstName)
                    .lastName(lastName)
                    .phone(phone)
                    .build();
            user.setAdmin(admin);
        }

        userRepository.save(user);

        auditService.log(actorEmail, "ROLE_PROMOTION", "USER", user.getId(),
                "Promoted " + email + " from CUSTOMER to ADMIN");

        return "User promoted to ADMIN successfully!";
    }

    /**
     * @deprecated Use {@link #promoteToAdmin(String, String)} with actorEmail for audit logging.
     */
    @Deprecated
    @Transactional
    public String promoteToAdmin(String email) {
        return promoteToAdmin(email, "SYSTEM");
    }

    // ── Demotion with last-admin protection & profile consistency ────────────────

    @Transactional
    public String demoteToUser(Long id, String actorEmail) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return "User not found";
        }
        User user = userOpt.get();

        if (!"ADMIN".equals(user.getRole())) {
            return "User is not an ADMIN";
        }

        // Last active administrator protection
        long activeAdminCount = userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE");
        if (activeAdminCount <= 1) {
            throw new IllegalStateException("Cannot demote the last active administrator");
        }

        user.setRole("CUSTOMER");

        // Profile consistency: create Customer profile from Admin data if missing
        if (user.getCustomer() == null) {
            String firstName = "Unknown";
            String lastName = "User";
            String phone = null;

            if (user.getAdmin() != null) {
                firstName = user.getAdmin().getFirstName();
                lastName = user.getAdmin().getLastName();
                phone = user.getAdmin().getPhone();
            }

            Customer customer = Customer.builder()
                    .user(user)
                    .firstName(firstName)
                    .lastName(lastName)
                    .phone(phone)
                    .addresses(new ArrayList<>())
                    .build();
            user.setCustomer(customer);
        }

        userRepository.save(user);

        auditService.log(actorEmail, "ROLE_DEMOTION", "USER", user.getId(),
                "Demoted " + user.getEmail() + " from ADMIN to CUSTOMER");

        return "User demoted to CUSTOMER successfully!";
    }

    /**
     * @deprecated Use {@link #demoteToUser(Long, String)} with actorEmail for audit logging.
     */
    @Deprecated
    @Transactional
    public String demoteToUser(Long id) {
        return demoteToUser(id, "SYSTEM");
    }

    // ── Controlled deactivation (replaces hard deletion) ────────────────────────

    @Transactional
    public void deactivateUser(Long id, String actorEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Last active administrator protection
        if ("ADMIN".equals(user.getRole())) {
            long activeAdminCount = userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE");
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot deactivate the last active administrator");
            }
        }

        user.setAccountStatus("DEACTIVATED");
        userRepository.save(user);

        auditService.log(actorEmail, "ACCOUNT_DEACTIVATION", "USER", user.getId(),
                "Deactivated account for " + user.getEmail());
    }

    @Transactional
    public void reactivateUser(Long id, String actorEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountStatus("ACTIVE");
        userRepository.save(user);

        auditService.log(actorEmail, "ACCOUNT_REACTIVATION", "USER", user.getId(),
                "Reactivated account for " + user.getEmail());
    }

    /**
     * @deprecated Use {@link #deactivateUser(Long, String)} for controlled deactivation.
     */
    @Deprecated
    @Transactional
    public void deleteUser(Long id) {
        deactivateUser(id, "SYSTEM");
    }

    public boolean existsByRole(String role) {
        return userRepository.existsByRole(role);
    }

    @Transactional
    public UserProfileResponse updateUserProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getCustomer() != null) {
            Customer customer = user.getCustomer();
            customer.setFirstName(request.getFirstName());
            customer.setLastName(request.getLastName());
            customer.setPhone(request.getPhone());
            if (request.getDateOfBirth() != null) {
                customer.setDateOfBirth(request.getDateOfBirth());
            }
            if (request.getProfileImage() != null) {
                customer.setProfileImage(request.getProfileImage());
            }

            if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
                    Address defaultAddr = customer.getAddresses().stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                            .findFirst()
                            .orElse(customer.getAddresses().get(0));
                    defaultAddr.setAddressLine1(request.getAddress());
                    if (request.getCity() != null) defaultAddr.setCity(request.getCity());
                    if (request.getDistrict() != null) defaultAddr.setDistrict(request.getDistrict());
                    if (request.getProvince() != null) defaultAddr.setProvince(request.getProvince());
                    if (request.getPostalCode() != null) defaultAddr.setPostalCode(request.getPostalCode());
                } else {
                    Address newAddr = Address.builder()
                            .customer(customer)
                            .recipientName((request.getFirstName() + " " + request.getLastName()).trim())
                            .phone(request.getPhone())
                            .addressLine1(request.getAddress())
                            .city(request.getCity() != null ? request.getCity() : "Colombo")
                            .district(request.getDistrict())
                            .province(request.getProvince())
                            .postalCode(request.getPostalCode())
                            .addressType("HOME")
                            .isDefault(true)
                            .build();
                    customer.getAddresses().add(newAddr);
                }
            }
            customerRepository.save(customer);
        } else if (user.getAdmin() != null) {
            Admin admin = user.getAdmin();
            admin.setFirstName(request.getFirstName());
            admin.setLastName(request.getLastName());
            admin.setPhone(request.getPhone());
            adminRepository.save(admin);
        }

        User updatedUser = userRepository.save(user);
        return UserProfileResponse.fromUser(updatedUser);
    }

    @Transactional
    public boolean changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return false;
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Invalidate existing tokens on password change
        user.setTokenVersion(user.getTokenVersion() == null ? 2L : user.getTokenVersion() + 1L);
        userRepository.save(user);
        return true;
    }

    /**
     * Increments the token version for the user, instantly invalidating any active JWT sessions.
     */
    @Transactional
    public void invalidateTokens(String email) {
        if (email == null) return;
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setTokenVersion(user.getTokenVersion() == null ? 2L : user.getTokenVersion() + 1L);
            userRepository.save(user);
        });
    }

    // ==========================================
    // Customer Address Management Operations
    // ==========================================

    @Transactional(readOnly = true)
    public List<AddressDto> getCustomerAddresses(String email) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found for email: " + email));

        return addressRepository.findByCustomerId(customer.getId())
                .stream()
                .map(AddressDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDto addCustomerAddress(String email, AddressDto addressDto) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found for email: " + email));

        List<Address> existingAddresses = addressRepository.findByCustomerId(customer.getId());
        boolean isFirst = existingAddresses.isEmpty();
        boolean shouldBeDefault = isFirst || Boolean.TRUE.equals(addressDto.getIsDefault());

        if (shouldBeDefault && !existingAddresses.isEmpty()) {
            for (Address a : existingAddresses) {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
        }

        String recipient = addressDto.getRecipientName();
        if (recipient == null || recipient.trim().isEmpty()) {
            recipient = (customer.getFirstName() + " " + customer.getLastName()).trim();
        }

        String phone = addressDto.getPhone();
        if (phone == null || phone.trim().isEmpty()) {
            phone = customer.getPhone();
        }

        String line1 = addressDto.getAddressLine1() != null ? addressDto.getAddressLine1() : addressDto.getAddress();

        Address address = Address.builder()
                .customer(customer)
                .recipientName(recipient)
                .phone(phone)
                .addressLine1(line1 != null ? line1.trim() : "")
                .addressLine2(addressDto.getAddressLine2())
                .city(addressDto.getCity() != null ? addressDto.getCity().trim() : "")
                .district(addressDto.getDistrict())
                .province(addressDto.getProvince())
                .postalCode(addressDto.getPostalCode())
                .country(addressDto.getCountry() != null ? addressDto.getCountry() : "Sri Lanka")
                .addressType(addressDto.getLabel() != null ? addressDto.getLabel() : "HOME")
                .isDefault(shouldBeDefault)
                .latitude(addressDto.getLatitude())
                .longitude(addressDto.getLongitude())
                .build();

        Address saved = addressRepository.save(address);
        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public AddressDto updateCustomerAddress(String email, Long addressId, AddressDto addressDto) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found for email: " + email));

        Address address = addressRepository.findByIdAndCustomerUserEmail(addressId, email)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        if (Boolean.TRUE.equals(addressDto.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> existing = addressRepository.findByCustomerId(customer.getId());
            for (Address a : existing) {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
            address.setIsDefault(true);
        }

        if (addressDto.getRecipientName() != null) address.setRecipientName(addressDto.getRecipientName());
        if (addressDto.getPhone() != null) address.setPhone(addressDto.getPhone());

        String line1 = addressDto.getAddressLine1() != null ? addressDto.getAddressLine1() : addressDto.getAddress();
        if (line1 != null) address.setAddressLine1(line1.trim());

        if (addressDto.getAddressLine2() != null) address.setAddressLine2(addressDto.getAddressLine2());
        if (addressDto.getCity() != null) address.setCity(addressDto.getCity().trim());
        if (addressDto.getDistrict() != null) address.setDistrict(addressDto.getDistrict());
        if (addressDto.getProvince() != null) address.setProvince(addressDto.getProvince());
        if (addressDto.getPostalCode() != null) address.setPostalCode(addressDto.getPostalCode());
        if (addressDto.getCountry() != null) address.setCountry(addressDto.getCountry());
        if (addressDto.getLabel() != null) address.setAddressType(addressDto.getLabel());
        if (addressDto.getLatitude() != null) address.setLatitude(addressDto.getLatitude());
        if (addressDto.getLongitude() != null) address.setLongitude(addressDto.getLongitude());

        Address saved = addressRepository.save(address);
        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public void deleteCustomerAddress(String email, Long addressId) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found for email: " + email));

        Address address = addressRepository.findByIdAndCustomerUserEmail(addressId, email)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByCustomerId(customer.getId());
            if (!remaining.isEmpty()) {
                Address first = remaining.get(0);
                first.setIsDefault(true);
                addressRepository.save(first);
            }
        }
    }

    @Transactional
    public AddressDto setDefaultCustomerAddress(String email, Long addressId) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found for email: " + email));

        Address targetAddress = addressRepository.findByIdAndCustomerUserEmail(addressId, email)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        List<Address> allAddresses = addressRepository.findByCustomerId(customer.getId());
        for (Address a : allAddresses) {
            a.setIsDefault(a.getId().equals(addressId));
            addressRepository.save(a);
        }

        return AddressDto.fromEntity(targetAddress);
    }
}
