package com.icrowd_api.features.auth;

import com.icrowd_api.features.audit.AuditService;
import com.icrowd_api.features.auth.dto.AdminUserSummaryDto;
import com.icrowd_api.features.auth.dto.ReauthRequest;
import com.icrowd_api.features.auth.security.CustomUserDetailsService;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import com.icrowd_api.features.category.CategoryService;
import com.icrowd_api.features.order.Order;
import com.icrowd_api.features.order.OrderController;
import com.icrowd_api.features.order.OrderService;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductController;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.product.ProductRequest;
import com.icrowd_api.features.product.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * OWASP-aligned authorization and business control tests for Admin Management.
 * Covers:
 *  - Broken Function Level Authorization (BFLA) role mapping & boundaries
 *  - Broken Object Level Authorization (BOLA) order receipt & user ownership
 *  - Last active administrator protection (cannot demote or deactivate)
 *  - Reauthentication requirement on sensitive admin operations
 *  - Controlled deactivation preserving data relationships
 *  - Role & Profile records consistency on promote/demote
 *  - Data minimization in user listings (AdminUserSummaryDto)
 *  - Audit logging of role changes, deactivations, prices, and stock
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Authorization & Business Controls Tests (OWASP)")
public class AdminAuthorizationSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @Mock
    private ProductService productService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private OrderService orderService;
    @Mock private com.icrowd_api.features.order.OrderRepository orderRepository;
    @org.junit.jupiter.api.io.TempDir java.nio.file.Path receiptDirectory;

    @InjectMocks
    private UserService userService;

    @InjectMocks
    private AdminController adminController;

    @InjectMocks
    private ProductController productController;

    @InjectMocks
    private OrderController orderController;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User activeAdminUser;
    private User activeCustomerUser;

    @BeforeEach
    void setUp() {
        var receiptService = new com.icrowd_api.features.order.ReceiptService(orderRepository,userRepository);
        ReflectionTestUtils.setField(receiptService,"directory",receiptDirectory.toString());
        ReflectionTestUtils.setField(orderController,"receipts",receiptService);
        // Wire up inter-service dependencies for controllers
        ReflectionTestUtils.setField(adminController, "userService", userService);

        Admin adminProfile = Admin.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Admin")
                .phone("0770000001")
                .build();

        activeAdminUser = User.builder()
                .id(10L)
                .email("admin@test.com")
                .password("encoded_admin_pass")
                .role("ADMIN")
                .accountStatus("ACTIVE")
                .admin(adminProfile)
                .createdAt(LocalDateTime.now())
                .build();
        adminProfile.setUser(activeAdminUser);

        Customer customerProfile = Customer.builder()
                .id(2L)
                .firstName("Bob")
                .lastName("Customer")
                .phone("0770000002")
                .addresses(new ArrayList<>())
                .build();

        activeCustomerUser = User.builder()
                .id(20L)
                .email("bob@test.com")
                .password("encoded_customer_pass")
                .role("CUSTOMER")
                .accountStatus("ACTIVE")
                .customer(customerProfile)
                .createdAt(LocalDateTime.now())
                .build();
        customerProfile.setUser(activeCustomerUser);
    }

    // =========================================================================
    // 1. Last Active Administrator Protection
    // =========================================================================
    @Nested
    @DisplayName("1. Last Active Administrator Protection")
    class LastAdminProtectionTests {

        @Test
        @DisplayName("Cannot demote the last active administrator")
        void testCannotDemoteLastActiveAdmin() {
            when(userRepository.findById(10L)).thenReturn(Optional.of(activeAdminUser));
            when(userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE")).thenReturn(1L);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                    userService.demoteToUser(10L, "actor@test.com")
            );

            assertTrue(ex.getMessage().contains("Cannot demote the last active administrator"));
            verify(userRepository, never()).save(argThat(u -> "CUSTOMER".equals(u.getRole())));
        }

        @Test
        @DisplayName("Can demote admin when multiple active admins exist")
        void testCanDemoteWhenMultipleActiveAdminsExist() {
            when(userRepository.findById(10L)).thenReturn(Optional.of(activeAdminUser));
            when(userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE")).thenReturn(2L);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            String result = userService.demoteToUser(10L, "actor@test.com");

            assertTrue(result.contains("successfully"));
            assertEquals("CUSTOMER", activeAdminUser.getRole());
            verify(auditService).log(eq("actor@test.com"), eq("ROLE_DEMOTION"), eq("USER"), eq(10L), anyString());
        }

        @Test
        @DisplayName("Cannot deactivate the last active administrator")
        void testCannotDeactivateLastActiveAdmin() {
            when(userRepository.findById(10L)).thenReturn(Optional.of(activeAdminUser));
            when(userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE")).thenReturn(1L);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                    userService.deactivateUser(10L, "actor@test.com")
            );

            assertTrue(ex.getMessage().contains("Cannot deactivate the last active administrator"));
            verify(userRepository, never()).save(argThat(u -> "DEACTIVATED".equals(u.getAccountStatus())));
        }
    }

    // =========================================================================
    // 2. Reauthentication Requirement for Sensitive Actions
    // =========================================================================
    @Nested
    @DisplayName("2. Reauthentication Requirement")
    class ReauthenticationTests {

        @Test
        @DisplayName("Reauthentication fails with incorrect admin password")
        void testReauthenticationFailsWithWrongPassword() {
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(activeAdminUser));
            when(passwordEncoder.matches("wrong_pwd", "encoded_admin_pass")).thenReturn(false);

            SecurityException ex = assertThrows(SecurityException.class, () ->
                    userService.validateAdminPassword("admin@test.com", "wrong_pwd")
            );

            assertTrue(ex.getMessage().contains("Reauthentication failed"));
        }

        @Test
        @DisplayName("Reauthentication succeeds with correct admin password")
        void testReauthenticationSucceedsWithCorrectPassword() {
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(activeAdminUser));
            when(passwordEncoder.matches("correct_pwd", "encoded_admin_pass")).thenReturn(true);

            assertDoesNotThrow(() ->
                    userService.validateAdminPassword("admin@test.com", "correct_pwd")
            );
        }

        @Test
        @DisplayName("Promote endpoint rejects action when reauthentication fails")
        void testAdminControllerPromoteRejectsFailedReauth() {
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(activeAdminUser));
            when(passwordEncoder.matches("bad_pwd", "encoded_admin_pass")).thenReturn(false);

            Authentication auth = new UsernamePasswordAuthenticationToken(
                    "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

            ReauthRequest req = new ReauthRequest("bad_pwd");
            ResponseEntity<?> response = adminController.promoteUser(20L, req, auth);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            verify(userRepository, never()).save(any(User.class));
        }
    }

    // =========================================================================
    // 3. Profile & Role Consistency on Promotion and Demotion
    // =========================================================================
    @Nested
    @DisplayName("3. Role & Profile Records Consistency")
    class ProfileConsistencyTests {

        @Test
        @DisplayName("Promoting customer creates missing Admin profile from customer data")
        void testPromotingCustomerCreatesAdminProfile() {
            when(userRepository.findByEmail("bob@test.com")).thenReturn(Optional.of(activeCustomerUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            assertNull(activeCustomerUser.getAdmin());

            String result = userService.promoteToAdmin("bob@test.com", "admin@test.com");

            assertTrue(result.contains("successfully"));
            assertEquals("ADMIN", activeCustomerUser.getRole());
            assertNotNull(activeCustomerUser.getAdmin());
            assertEquals("Bob", activeCustomerUser.getAdmin().getFirstName());
            assertEquals("Customer", activeCustomerUser.getAdmin().getLastName());
            assertEquals("0770000002", activeCustomerUser.getAdmin().getPhone());
            verify(auditService).log(eq("admin@test.com"), eq("ROLE_PROMOTION"), eq("USER"), eq(20L), anyString());
        }

        @Test
        @DisplayName("Demoting admin creates missing Customer profile from admin data")
        void testDemotingAdminCreatesCustomerProfile() {
            // Admin with no prior customer profile
            activeAdminUser.setCustomer(null);
            when(userRepository.findById(10L)).thenReturn(Optional.of(activeAdminUser));
            when(userRepository.countByRoleAndAccountStatus("ADMIN", "ACTIVE")).thenReturn(3L);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            String result = userService.demoteToUser(10L, "superadmin@test.com");

            assertTrue(result.contains("successfully"));
            assertEquals("CUSTOMER", activeAdminUser.getRole());
            assertNotNull(activeAdminUser.getCustomer());
            assertEquals("Alice", activeAdminUser.getCustomer().getFirstName());
            assertEquals("Admin", activeAdminUser.getCustomer().getLastName());
            assertEquals("0770000001", activeAdminUser.getCustomer().getPhone());
        }
    }

    // =========================================================================
    // 4. Controlled Deactivation (Preserving Order History)
    // =========================================================================
    @Nested
    @DisplayName("4. Controlled Deactivation")
    class ControlledDeactivationTests {

        @Test
        @DisplayName("Deactivating user sets accountStatus to DEACTIVATED and preserves DB record")
        void testControlledDeactivationPreservesRecord() {
            when(userRepository.findById(20L)).thenReturn(Optional.of(activeCustomerUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.deactivateUser(20L, "admin@test.com");

            assertEquals("DEACTIVATED", activeCustomerUser.getAccountStatus());
            // Hard deletion must NEVER be called
            verify(userRepository, never()).deleteById(anyLong());
            verify(userRepository, never()).delete(any(User.class));
            verify(auditService).log(eq("admin@test.com"), eq("ACCOUNT_DEACTIVATION"), eq("USER"), eq(20L), anyString());
        }

        @Test
        @DisplayName("Reactivating a deactivated user restores ACTIVE status")
        void testReactivationRestoresActiveStatus() {
            activeCustomerUser.setAccountStatus("DEACTIVATED");
            when(userRepository.findById(20L)).thenReturn(Optional.of(activeCustomerUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.reactivateUser(20L, "admin@test.com");

            assertEquals("ACTIVE", activeCustomerUser.getAccountStatus());
            verify(auditService).log(eq("admin@test.com"), eq("ACCOUNT_REACTIVATION"), eq("USER"), eq(20L), anyString());
        }

        @Test
        @DisplayName("Deactivated user has enabled=false in Spring Security UserDetails")
        void testDeactivatedUserDisabledInSecurity() {
            activeCustomerUser.setAccountStatus("DEACTIVATED");
            when(userRepository.findByEmail("bob@test.com")).thenReturn(Optional.of(activeCustomerUser));

            UserDetails userDetails = customUserDetailsService.loadUserByUsername("bob@test.com");

            assertFalse(userDetails.isEnabled(), "Deactivated account must have isEnabled() == false");
        }
    }

    // =========================================================================
    // 5. Data Minimization & Pagination in Admin User Listings
    // =========================================================================
    @Nested
    @DisplayName("5. Data Minimization & Pagination")
    class DataMinimizationTests {

        @Test
        @DisplayName("AdminUserSummaryDto contains only needed fields, stripping addresses and passwords")
        void testAdminUserSummaryDtoDataMinimization() {
            PageRequest pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(activeCustomerUser), pageable, 1);

            when(userRepository.searchUsersForAdmin(any(), any(), eq(pageable))).thenReturn(userPage);

            Page<AdminUserSummaryDto> dtoPage = userService.getUsersForAdmin(pageable, null, null);

            assertEquals(1, dtoPage.getContent().size());
            AdminUserSummaryDto dto = dtoPage.getContent().get(0);

            assertEquals(20L, dto.getId());
            assertEquals("bob@test.com", dto.getEmail());
            assertEquals("Bob", dto.getFirstName());
            assertEquals("Customer", dto.getLastName());
            assertEquals("0770000002", dto.getPhone());
            assertEquals("CUSTOMER", dto.getRole());
            assertEquals("ACTIVE", dto.getAccountStatus());
        }
    }

    // =========================================================================
    // 6. Role Expansion & Narrower Permissions (BFLA)
    // =========================================================================
    @Nested
    @DisplayName("6. Narrower Permissions & Authority Mapping")
    class NarrowerPermissionsTests {

        @Test
        @DisplayName("INVENTORY_MANAGER gets only inventory management authority")
        void testInventoryManagerAuthorities() {
            User invUser = User.builder()
                    .email("inv@test.com")
                    .password("secret")
                    .role("INVENTORY_MANAGER")
                    .accountStatus("ACTIVE")
                    .build();
            when(userRepository.findByEmail("inv@test.com")).thenReturn(Optional.of(invUser));

            UserDetails userDetails = customUserDetailsService.loadUserByUsername("inv@test.com");

            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_INVENTORY_MANAGER")));
            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("PERM_INVENTORY_MANAGE")));
            assertFalse(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
            assertFalse(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("PERM_ACCOUNTS_MANAGE")));
        }

        @Test
        @DisplayName("ADMIN gets inventory authority, accounts authority, and analytics authority")
        void testAdminAuthoritiesHierarchy() {
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(activeAdminUser));

            UserDetails userDetails = customUserDetailsService.loadUserByUsername("admin@test.com");

            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_INVENTORY_MANAGER")));
            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("PERM_INVENTORY_MANAGE")));
            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("PERM_ACCOUNTS_MANAGE")));
            assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("PERM_ANALYTICS_VIEW")));
        }
    }

    // =========================================================================
    // 7. Broken Object Level Authorization (BOLA) Ownership Boundaries
    // =========================================================================
    @Nested
    @DisplayName("7. BOLA Ownership Boundaries")
    class BolaOwnershipTests {

        @Test
        @DisplayName("Customer cannot upload receipt to another customer's order")
        void testCustomerCannotUploadReceiptToOtherOrder() throws Exception {
            Order order = Order.builder()
                    .id(100L)
                    .user(activeCustomerUser) // Owned by bob@test.com
                    .build();

            when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

            // Eve (another customer) tries to upload a receipt
            Authentication eveAuth = new UsernamePasswordAuthenticationToken(
                    "eve@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));

            MockMultipartFile file = new MockMultipartFile("file", "receipt.jpg", "image/jpeg", "%PDF-1.7 test receipt".getBytes());

            var denied = assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> orderController.uploadReceipt(100L, file, eveAuth));
            assertEquals(HttpStatus.FORBIDDEN,denied.getStatusCode());
            verify(orderService, never()).updateReceiptUrl(anyLong(), anyString());
        }

        @Test
        @DisplayName("Order owner is allowed to upload receipt to their own order")
        void testOwnerCanUploadReceipt() throws Exception {
            Order order = Order.builder()
                    .id(100L)
                    .user(activeCustomerUser) // Owned by bob@test.com
                    .build();

            when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

            Authentication bobAuth = new UsernamePasswordAuthenticationToken(
                    "bob@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));

            MockMultipartFile file = new MockMultipartFile("file", "receipt.jpg", "image/jpeg", "%PDF-1.7 test receipt".getBytes());

            when(orderRepository.findForUpdate(100L)).thenReturn(Optional.of(order));
            when(userRepository.findForCheckout("bob@test.com")).thenReturn(Optional.of(activeCustomerUser));
            when(userRepository.findByEmail("bob@test.com")).thenReturn(Optional.of(activeCustomerUser));
            ResponseEntity<?> response = orderController.uploadReceipt(100L, file, bobAuth);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("/api/orders/100/receipt",order.getReceiptUrl());
            assertTrue(java.nio.file.Files.exists(receiptDirectory.resolve("100.receipt")));
        }

        @Test
        @DisplayName("Admin is permitted to upload receipt to any customer order")
        void testAdminCanUploadReceiptToAnyOrder() throws Exception {
            Order order = Order.builder()
                    .id(100L)
                    .user(activeCustomerUser) // Owned by bob@test.com
                    .build();

            when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

            Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                    "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

            MockMultipartFile file = new MockMultipartFile("file", "receipt.jpg", "image/jpeg", "%PDF-1.7 test receipt".getBytes());

            when(orderRepository.findForUpdate(100L)).thenReturn(Optional.of(order));
            when(userRepository.findForCheckout("bob@test.com")).thenReturn(Optional.of(activeCustomerUser));
            ResponseEntity<?> response = orderController.uploadReceipt(100L, file, adminAuth);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("/api/orders/100/receipt",order.getReceiptUrl());
            assertTrue(java.nio.file.Files.exists(receiptDirectory.resolve("100.receipt")));
        }
    }

    // =========================================================================
    // 8. Price & Stock Adjustment Audit Logging
    // =========================================================================
    @Nested
    @DisplayName("8. Price & Stock Audit Logging")
    class AuditLoggingTests {

        @Test
        @DisplayName("Product price change and stock adjustment are recorded in audit log")
        void testPriceAndStockChangeAuditLogged() {
            Product existingProduct = Product.builder()
                    .id(55L)
                    .name("Widget Pro")
                    .price(new BigDecimal("100.00"))
                    .availableStock(50)
                    .build();

            Category mockCategory = new Category();
            mockCategory.setId(1L);

            ProductRequest updateRequest = new ProductRequest(
                    "WDG-001",
                    "Widget Pro",
                    "Updated description",
                    1L,
                    new BigDecimal("120.00"), // Price changed
                    45,                       // Stock changed
                    List.of(),
                    List.of(),
                      true, null, null, 0L
            );

            // Test product service directly with mocked repos
            ProductRepository mockProdRepo = mock(ProductRepository.class);
            CategoryRepository mockCatRepo = mock(CategoryRepository.class);
            AuditService mockAudit = mock(AuditService.class);

            when(mockProdRepo.findById(55L)).thenReturn(Optional.of(existingProduct));
            when(mockCatRepo.findById(1L)).thenReturn(Optional.of(mockCategory));
            when(mockProdRepo.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

            ProductService customProdService = new ProductService(mockProdRepo, mockCatRepo, mockAudit);
            customProdService.updateProduct(55L, updateRequest, "manager@test.com");

            // Verify both audit logs: PRICE_CHANGE and STOCK_ADJUSTMENT
            verify(mockAudit).log(eq("manager@test.com"), eq("PRICE_CHANGE"), eq("PRODUCT"), eq(55L),
                    contains("100.00 -> 120.00"));
            verify(mockAudit).log(eq("manager@test.com"), eq("STOCK_ADJUSTMENT"), eq("PRODUCT"), eq(55L),
                    contains("50 -> 45"));
        }
    }
}
