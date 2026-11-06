package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.auth.dto.ChangePasswordRequest;
import com.icrowd_api.features.auth.dto.RegisterRequest;
import com.icrowd_api.features.auth.dto.UpdateProfileRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
    public String promoteToAdmin(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "User not found with email: " + email;
        }
        User user = userOpt.get();
        user.setRole("ADMIN");
        userRepository.save(user);
        return "User promoted to ADMIN successfully!";
    }

    @Transactional
    public String demoteToUser(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return "User not found";
        }
        User user = userOpt.get();
        user.setRole("CUSTOMER");
        userRepository.save(user);
        return "User demoted to CUSTOMER successfully!";
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
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
