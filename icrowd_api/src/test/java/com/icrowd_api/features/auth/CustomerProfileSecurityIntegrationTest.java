package com.icrowd_api.features.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.auth.dto.UpdateProfileRequest;
import com.icrowd_api.features.cart.Cart;
import com.icrowd_api.features.cart.CartItem;
import com.icrowd_api.features.cart.dto.CartResponseDto;
import com.icrowd_api.features.product.Product;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class CustomerProfileSecurityIntegrationTest {

    private static Validator validator;
    private static ObjectMapper objectMapper;

    @BeforeAll
    static void init() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    void testCartResponseDtoAndUserExcludeCredentials() throws Exception {
        User user = User.builder()
                .id(99L)
                .email("secure@test.com")
                .password("$2a$10$supersecretbcryptpasswordhash")
                .role("CUSTOMER")
                .tokenVersion(12345L)
                .build();

        // 1. Verify User serialization excludes password and tokenVersion
        String userJson = objectMapper.writeValueAsString(user);
        assertFalse(userJson.contains("supersecretbcryptpasswordhash"), "Password hash MUST NOT be serialized");
        assertFalse(userJson.contains("\"password\""), "Password field MUST NOT be in serialized User JSON");
        assertFalse(userJson.contains("\"tokenVersion\""), "Token version MUST NOT be exposed");

        // 2. Verify CartResponseDto excludes User credentials and circular references
        Product product = Product.builder()
                .id(50L)
                .name("Wireless Headset")
                .price(BigDecimal.valueOf(120.00))
                .availableStock(10)
                .imageUrls(List.of("https://example.com/item.png"))
                .build();

        Cart cart = Cart.builder()
                .id(1L)
                .user(user)
                .items(new ArrayList<>())
                .build();

        CartItem item = CartItem.builder()
                .id(10L)
                .cart(cart)
                .product(product)
                .quantity(2)
                .build();
        cart.getItems().add(item);

        CartResponseDto cartDto = CartResponseDto.fromEntity(cart);
        String cartJson = objectMapper.writeValueAsString(cartDto);

        assertFalse(cartJson.contains("password"), "Cart JSON MUST NOT contain password");
        assertFalse(cartJson.contains("supersecretbcryptpasswordhash"), "Cart JSON MUST NOT expose password hash");
        assertTrue(cartJson.contains("Wireless Headset"));
        assertEquals(1, cartDto.getItems().size());
        assertEquals(2, cartDto.getItems().get(0).getQuantity());
        assertEquals(50L, cartDto.getItems().get(0).getProduct().getId());
    }

    @Test
    void testUpdateProfileRequestValidation() {
        // Valid request
        UpdateProfileRequest validReq = UpdateProfileRequest.builder()
                .firstName("Kamal")
                .lastName("Perera")
                .phone("+94771234567")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .profileImage("https://example.com/avatar.jpg")
                .address("100 Main Road")
                .city("Colombo")
                .district("Colombo")
                .province("Western Province")
                .postalCode("00300")
                .build();

        Set<ConstraintViolation<UpdateProfileRequest>> violations = validator.validate(validReq);
        assertTrue(violations.isEmpty(), "Valid profile request should have no violations");

        // Invalid phone
        UpdateProfileRequest invalidPhone = UpdateProfileRequest.builder()
                .firstName("Kamal")
                .lastName("Perera")
                .phone("abc-invalid-phone")
                .build();
        violations = validator.validate(invalidPhone);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));

        // Future birth date
        UpdateProfileRequest futureDob = UpdateProfileRequest.builder()
                .firstName("Kamal")
                .lastName("Perera")
                .phone("+94771234567")
                .dateOfBirth(LocalDate.now().plusDays(10))
                .build();
        violations = validator.validate(futureDob);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("dateOfBirth")));

        // Invalid image URL (not http/https)
        UpdateProfileRequest invalidImage = UpdateProfileRequest.builder()
                .firstName("Kamal")
                .lastName("Perera")
                .phone("+94771234567")
                .profileImage("javascript:alert(1)")
                .build();
        violations = validator.validate(invalidImage);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("profileImage")));

        // Excessively long name
        UpdateProfileRequest longName = UpdateProfileRequest.builder()
                .firstName("A".repeat(51))
                .lastName("Perera")
                .phone("+94771234567")
                .build();
        violations = validator.validate(longName);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("firstName")));
    }

    @Test
    void testAddressDtoValidation() {
        // Valid address
        AddressDto validAddr = AddressDto.builder()
                .recipientName("John Doe")
                .phone("+94771234567")
                .address("123 Galle Rd")
                .city("Colombo")
                .latitude(6.9271)
                .longitude(79.8612)
                .postalCode("00300")
                .build();

        Set<ConstraintViolation<AddressDto>> violations = validator.validate(validAddr);
        assertTrue(violations.isEmpty(), "Valid address DTO should have no violations");

        // Invalid phone
        AddressDto badPhone = AddressDto.builder()
                .recipientName("John Doe")
                .phone("invalid")
                .address("123 Galle Rd")
                .city("Colombo")
                .build();
        violations = validator.validate(badPhone);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));

        // Latitude out of range
        AddressDto badLat = AddressDto.builder()
                .recipientName("John Doe")
                .phone("+94771234567")
                .address("123 Galle Rd")
                .city("Colombo")
                .latitude(95.0) // invalid (> 90)
                .longitude(79.8612)
                .build();
        violations = validator.validate(badLat);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("latitude")));

        // Longitude out of range
        AddressDto badLng = AddressDto.builder()
                .recipientName("John Doe")
                .phone("+94771234567")
                .address("123 Galle Rd")
                .city("Colombo")
                .latitude(6.9271)
                .longitude(195.0) // invalid (> 180)
                .build();
        violations = validator.validate(badLng);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("longitude")));
    }
}
