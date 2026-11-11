package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.auth.dto.RegisterRequest;
import com.icrowd_api.features.auth.dto.UserProfileResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.icrowd_api.features.audit.AuditService auditService;

    @InjectMocks
    private UserService userService;

    @Test
    void testRegisterCustomerSuccessfully() {
        RegisterRequest req = RegisterRequest.builder()
                .email("customer@test.com")
                .password("secret123")
                .firstName("Kamal")
                .lastName("Perera")
                .phone("+94771234567")
                .role("CUSTOMER")
                .address("100 Galle Rd")
                .city("Colombo")
                .district("Colombo")
                .build();

        Mockito.when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
        Mockito.when(passwordEncoder.encode(req.getPassword())).thenReturn("encodedPassword");
        Mockito.when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = userService.registerUser(req);
        assertEquals("User registered successfully!", result);
    }

    @Test
    void testRegisterAdminSuccessfully() {
        RegisterRequest req = RegisterRequest.builder()
                .email("admin@test.com")
                .password("adminpass")
                .firstName("Admin")
                .lastName("User")
                .phone("+94770000000")
                .role("ADMIN")
                .build();

        Mockito.when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
        Mockito.when(passwordEncoder.encode(req.getPassword())).thenReturn("encodedAdminPass");
        Mockito.when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = userService.registerAdmin(req);
        assertEquals("Admin registered successfully!", result);
    }

    @Test
    void testPublicRegistrationIgnoresAdminRole() {
        RegisterRequest req = RegisterRequest.builder()
                .email("hacker@test.com")
                .password("hackerpass")
                .firstName("Hacker")
                .lastName("User")
                .phone("+94771111111")
                .role("ADMIN") // Publicly attempting to register as ADMIN
                .build();

        Mockito.when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
        Mockito.when(passwordEncoder.encode(req.getPassword())).thenReturn("encodedPass");
        org.mockito.ArgumentCaptor<User> userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        Mockito.when(userRepository.save(userCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        String result = userService.registerUser(req);
        assertEquals("User registered successfully!", result);
        // Verify public registration strictly assigned CUSTOMER role
        assertEquals("CUSTOMER", userCaptor.getValue().getRole());
    }

    @Test
    void testGetUserProfileAggregatesCorrectly() {
        User user = User.builder()
                .id(1L)
                .email("customer@test.com")
                .role("CUSTOMER")
                .accountStatus("ACTIVE")
                .build();

        Customer customer = Customer.builder()
                .id(10L)
                .user(user)
                .firstName("Nimal")
                .lastName("Silva")
                .phone("+94712345678")
                .addresses(new ArrayList<>())
                .build();

        Address address = Address.builder()
                .id(100L)
                .customer(customer)
                .addressLine1("45 Temple Rd")
                .city("Kandy")
                .district("Kandy")
                .isDefault(true)
                .build();
        customer.getAddresses().add(address);
        user.setCustomer(customer);

        Mockito.when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(user));

        Optional<UserProfileResponse> profile = userService.getUserProfile("customer@test.com");
        assertTrue(profile.isPresent());
        assertEquals("Nimal", profile.get().getFirstName());
        assertEquals("Silva", profile.get().getLastName());
        assertEquals("45 Temple Rd", profile.get().getAddress());
        assertEquals("Kandy", profile.get().getCity());
        assertEquals(1, profile.get().getAddresses().size());
    }

    @Test
    void testAddCustomerAddress() {
        String email = "customer@test.com";
        Customer customer = Customer.builder()
                .id(10L)
                .firstName("Nimal")
                .lastName("Silva")
                .phone("+94712345678")
                .build();

        AddressDto newAddr = AddressDto.builder()
                .recipientName("Nimal Silva")
                .addressLine1("123 Main St")
                .city("Colombo")
                .district("Colombo")
                .label("WORK")
                .isDefault(true)
                .build();

        Mockito.when(customerRepository.findByUserEmail(email)).thenReturn(Optional.of(customer));
        Mockito.when(addressRepository.findByCustomerId(10L)).thenReturn(new ArrayList<>());
        Mockito.when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        AddressDto result = userService.addCustomerAddress(email, newAddr);
        assertNotNull(result);
        assertEquals(101L, result.getId());
        assertEquals("123 Main St", result.getAddress());
        assertEquals("WORK", result.getLabel());
        assertTrue(result.getIsDefault());
    }
}
