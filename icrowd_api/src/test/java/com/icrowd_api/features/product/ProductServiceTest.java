package com.icrowd_api.features.product;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.cart.CartRepository;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import com.icrowd_api.features.order.OrderItemRepository;
import com.icrowd_api.features.order.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProductService productService;

    private Product product1;
    private Product product2;
    private Product product3;

    @BeforeEach
    void setUp() {
        Category electronics = Category.builder().id(1L).name("Electronics").build();

        product1 = Product.builder().id(1L).name("Laptop").category(electronics).price(BigDecimal.valueOf(1000)).isActive(true).build();
        product2 = Product.builder().id(2L).name("Headphones").category(electronics).price(BigDecimal.valueOf(100)).isActive(true).build();
        product3 = Product.builder().id(3L).name("Mouse").category(electronics).price(BigDecimal.valueOf(50)).isActive(true).build();
    }

    @Test
    void testGetRecommendations_NewUserOrUnauthenticated_ReturnsTrendingAndFallback() {
        // Given no user is authenticated or new user
        when(orderItemRepository.findTopSellingProductIds(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(1L));
        when(productRepository.findAllById(List.of(1L)))
                .thenReturn(List.of(product1));
        when(productRepository.findByIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product2, product3)));

        // When
        List<Product> results = productService.getRecommendedProducts(null, 3);

        // Then
        assertEquals(3, results.size());
        assertTrue(results.contains(product1));
        assertTrue(results.contains(product2));
        assertTrue(results.contains(product3));
    }

    @Test
    void testGetRecommendations_AuthenticatedUserWithHistory_CombinesPersonalizedAndTrending() {
        // Given authenticated user with order history in Category 1
        User user = User.builder().id(10L).email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findUserPurchasedCategoryIds(10L)).thenReturn(List.of(1L));
        when(cartRepository.findUserCartCategoryIds(10L)).thenReturn(List.of());

        // Personalized returns product1
        when(productRepository.findTopProductsByCategories(eq(List.of(1L)), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product1)));

        // Trending returns product2
        when(orderItemRepository.findTopSellingProductIds(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(2L));
        when(productRepository.findAllById(List.of(2L)))
                .thenReturn(List.of(product2));

        // When
        List<Product> results = productService.getRecommendedProducts("user@example.com", 2);

        // Then
        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).getId()); // personalized
        assertEquals(2L, results.get(1).getId()); // trending
    }

    @Test
    void testGetFeaturedProducts_ReturnsTopSellingOrFallback() {
        when(orderItemRepository.findTopSellingProductIds(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(1L));
        when(productRepository.findAllById(List.of(1L)))
                .thenReturn(List.of(product1));
        when(productRepository.findByIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product2)));

        List<Product> results = productService.getFeaturedProducts(2);

        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).getId());
        assertEquals(2L, results.get(1).getId());
    }

    @Test
    void testGetLatestProducts_ReturnsOrderedByCreatedAt() {
        when(productRepository.findByIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product3, product2, product1)));

        List<Product> results = productService.getLatestProducts(3);

        assertEquals(3, results.size());
        assertEquals(3L, results.get(0).getId());
    }

    @Test
    void testGetSimilarProducts_ReturnsSameCategoryExcludingCurrent() {
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(product1));
        when(productRepository.findSimilarProductsByCategory(eq(1L), eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product2, product3)));

        List<Product> results = productService.getSimilarProducts(1L, null, 2);

        assertEquals(2, results.size());
        assertTrue(results.contains(product2));
        assertTrue(results.contains(product3));
        assertFalse(results.contains(product1));
    }

    @Test
    void testGetCartSuggestions_ExcludesItemsInCart() {
        when(productRepository.findAllById(List.of(1L))).thenReturn(List.of(product1));
        when(productRepository.findTopProductsByCategories(eq(List.of(1L)), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product1, product2)));
        when(orderItemRepository.findTopSellingProductIds(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(3L));
        when(productRepository.findAllById(List.of(3L)))
                .thenReturn(List.of(product3));
        when(productRepository.findByIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product2, product3)));

        List<Product> results = productService.getCartSuggestions(List.of(1L), null, 2);

        assertEquals(2, results.size());
        assertFalse(results.contains(product1)); // Excludes item already in cart
        assertTrue(results.contains(product2));
    }

    @Test
    void browseRejectsInvalidInputs() {
        assertThrows(IllegalArgumentException.class, () -> productService.browse(null, null, "unknown", 0, 10, null, null, null, false, null, false));
        assertThrows(IllegalArgumentException.class, () -> productService.browse(null, null, null, -1, 10, null, null, null, false, null, false));
        assertThrows(IllegalArgumentException.class, () -> productService.browse(null, null, null, 0, 101, null, null, null, false, null, false));
        assertThrows(IllegalArgumentException.class, () -> productService.browse(null, null, null, 0, 10, BigDecimal.TEN, BigDecimal.ONE, null, false, null, false));
        assertThrows(IllegalArgumentException.class, () -> productService.browse(null, null, null, 0, 10, null, null, null, false, 6.0, false));
        verifyNoInteractions(productRepository);
    }

    @Test
    void browseUsesStableSortAndRecoversOutOfRangePages() {
        when(productRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(8, 10), 12))
            .thenReturn(new PageImpl<>(List.of(product1), org.springframework.data.domain.PageRequest.of(1, 10), 12));
        var result = productService.browse(null, null, "price_asc", 8, 10, null, null, null, false, null, false);
        var pages = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository, times(2)).findAll(any(org.springframework.data.jpa.domain.Specification.class), pages.capture());
        assertEquals(1, pages.getAllValues().get(1).getPageNumber());
        assertNotNull(pages.getValue().getSort().getOrderFor("id"));
        assertTrue(pages.getValue().getSort().getOrderFor("price").isAscending());
        assertEquals(List.of(product1), result.getContent());
    }
}

