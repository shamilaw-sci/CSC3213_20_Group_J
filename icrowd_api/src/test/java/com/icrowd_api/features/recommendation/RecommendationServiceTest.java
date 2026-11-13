package com.icrowd_api.features.recommendation;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.cart.CartRepository;
import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.order.*;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.product.ProductView;
import com.icrowd_api.features.product.ProductViewRepository;
import com.icrowd_api.features.recommendation.dto.FrequentlyBoughtTogetherResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RecommendationServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductViewRepository productViewRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartRepository cartRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private Category phoneCat;
    private Category caseCat;
    private Category audioCat;
    private Product iphone16;
    private Product galaxyS24;
    private Product spigenCase;
    private Product airpods;

    @BeforeEach
    void setUp() {
        phoneCat = Category.builder().id(1L).name("Smartphone").build();
        caseCat = Category.builder().id(2L).name("Case").build();
        audioCat = Category.builder().id(3L).name("Headset").build();

        iphone16 = Product.builder()
                .id(101L)
                .name("Apple iPhone 16 Pro")
                .sku("SKU-IP16")
                .brand("Apple")
                .category(phoneCat)
                .price(new BigDecimal("395000.00"))
                .costPrice(new BigDecimal("230000.00"))
                .availableStock(15)
                .averageRating(4.9)
                .tags(List.of("apple", "iphone", "flagship", "5g", "titanium"))
                .isActive(true)
                .build();

        galaxyS24 = Product.builder()
                .id(102L)
                .name("Samsung Galaxy S24 Ultra")
                .sku("SKU-S24")
                .brand("Samsung")
                .category(phoneCat)
                .price(new BigDecimal("365000.00"))
                .costPrice(new BigDecimal("210000.00"))
                .availableStock(12)
                .averageRating(4.8)
                .tags(List.of("samsung", "galaxy", "flagship", "5g", "ai"))
                .isActive(true)
                .build();

        spigenCase = Product.builder()
                .id(103L)
                .name("Spigen Ultra Hybrid Case for iPhone 16")
                .sku("SKU-CASE1")
                .brand("Spigen")
                .category(caseCat)
                .price(new BigDecimal("8900.00"))
                .costPrice(new BigDecimal("4500.00"))
                .availableStock(50)
                .averageRating(4.7)
                .tags(List.of("apple", "case", "magsafe", "iphone"))
                .isActive(true)
                .build();

        airpods = Product.builder()
                .id(104L)
                .name("Apple AirPods Max")
                .sku("SKU-APMAX")
                .brand("Apple")
                .category(audioCat)
                .price(new BigDecimal("189000.00"))
                .costPrice(new BigDecimal("110000.00"))
                .availableStock(20)
                .averageRating(4.6)
                .tags(List.of("apple", "audio", "anc", "bluetooth"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("1. Multi-Attribute Content-Based Similarity should rank Galaxy S24 as top similar for iPhone 16")
    void testSimilarProductsContentBased() {
        when(productRepository.findByIdAndIsActiveTrue(101L)).thenReturn(Optional.of(iphone16));
        when(productRepository.findAllActiveProductsList()).thenReturn(List.of(iphone16, galaxyS24, spigenCase, airpods));

        List<Product> similar = recommendationService.getSimilarProducts(101L, 3);

        assertNotNull(similar);
        assertFalse(similar.isEmpty());
        // Since Galaxy S24 shares the same category (Smartphone), similar price band and tags, it should rank highest among other phones
        assertEquals(galaxyS24.getId(), similar.get(0).getId());
    }

    @Test
    @DisplayName("2. Frequently Bought Together should return empirical basket partner from order items")
    void testFrequentlyBoughtTogetherEmpirical() {
        when(productRepository.findByIdAndIsActiveTrue(101L)).thenReturn(Optional.of(iphone16));
        List<Object[]> cooccurrence = new ArrayList<>();
        cooccurrence.add(new Object[]{103L, 5L});
        when(orderItemRepository.findFrequentlyBoughtTogetherProductIds(eq(101L), any(), any(Pageable.class)))
                .thenReturn(cooccurrence);
        when(productRepository.findByIdAndIsActiveTrue(103L)).thenReturn(Optional.of(spigenCase));

        FrequentlyBoughtTogetherResponse response = recommendationService.getFrequentlyBoughtTogether(101L, 2);

        assertNotNull(response);
        assertEquals(iphone16.getId(), response.getTargetProduct().getId());
        assertEquals(1, response.getBundledProducts().size());
        assertEquals(spigenCase.getId(), response.getBundledProducts().get(0).getId());
        assertTrue(response.getIsEmpiricalBasket());
        // Check bundle savings discount is applied
        assertTrue(response.getBundleTotal().compareTo(response.getRegularTotal()) < 0);
        assertTrue(response.getSavings().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("3. Frequently Bought Together should fall back to complementary accessories on cold-start")
    void testFrequentlyBoughtTogetherFallback() {
        when(productRepository.findByIdAndIsActiveTrue(101L)).thenReturn(Optional.of(iphone16));
        when(orderItemRepository.findFrequentlyBoughtTogetherProductIds(eq(101L), any(), any(Pageable.class)))
                .thenReturn(List.of()); // No prior shared orders
        when(productRepository.findAllActiveProductsList()).thenReturn(List.of(iphone16, spigenCase, airpods));

        FrequentlyBoughtTogetherResponse response = recommendationService.getFrequentlyBoughtTogether(101L, 2);

        assertNotNull(response);
        assertFalse(response.getIsEmpiricalBasket());
        assertFalse(response.getBundledProducts().isEmpty());
        // For Smartphone, complementary category is Case
        assertEquals(caseCat.getName(), response.getBundledProducts().get(0).getCategory().getName());
    }

    @Test
    @DisplayName("4. Trending Products should apply time-decay weighting to recent orders")
    void testTrendingProductsDecayedVelocity() {
        Order recentOrder = Order.builder()
                .id(1L)
                .status(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now().minusDays(1))
                .items(List.of(OrderItem.builder().product(iphone16).quantity(2).build()))
                .build();

        Order oldOrder = Order.builder()
                .id(2L)
                .status(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now().minusDays(25))
                .items(List.of(OrderItem.builder().product(galaxyS24).quantity(2).build()))
                .build();

        when(orderRepository.findAllQualifyingOrders(any())).thenReturn(List.of(recentOrder, oldOrder));
        when(productRepository.findByIdAndIsActiveTrue(101L)).thenReturn(Optional.of(iphone16));
        when(productRepository.findByIdAndIsActiveTrue(102L)).thenReturn(Optional.of(galaxyS24));
        when(productRepository.findAllActiveProductsList()).thenReturn(List.of(iphone16, galaxyS24));

        List<Product> trending = recommendationService.getTrendingProducts(30, 2);

        assertNotNull(trending);
        assertFalse(trending.isEmpty());
        // Recent order on iphone16 has exponentially higher decayed weight than 25-day-old galaxy order
        assertEquals(iphone16.getId(), trending.get(0).getId());
    }

    @Test
    @DisplayName("5. Track View & Recently Viewed Products should record and retrieve in reverse chronological order")
    void testTrackViewAndRecentlyViewed() {
        User user = User.builder().id(501L).email("user@icrowd.com").build();
        when(userRepository.findByEmail("user@icrowd.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(101L)).thenReturn(Optional.of(iphone16));

        recommendationService.trackProductView(101L, "user@icrowd.com", "sess-123", "VIEW");
        verify(productViewRepository, times(1)).save(any(ProductView.class));

        ProductView pv = ProductView.builder().product(iphone16).user(user).viewedAt(LocalDateTime.now()).build();
        when(productViewRepository.findRecentByUserId(eq(501L), any(Pageable.class))).thenReturn(List.of(pv));

        List<Product> recent = recommendationService.getRecentlyViewed("user@icrowd.com", null, 5);
        assertEquals(1, recent.size());
        assertEquals(iphone16.getId(), recent.get(0).getId());
    }

    @Test
    @DisplayName("6. Budget-Aware Recommendations should strictly filter within maximum price limit")
    void testBudgetAwareRecommendations() {
        when(productRepository.findAllActiveProductsList()).thenReturn(List.of(iphone16, galaxyS24, spigenCase, airpods));

        // Filter budget under 50,000 LKR
        List<Product> affordable = recommendationService.getBudgetAwareRecommendations(
                new BigDecimal("50000.00"), null, null, 10
        );

        assertEquals(1, affordable.size());
        assertEquals(spigenCase.getId(), affordable.get(0).getId());
        assertTrue(affordable.get(0).getPrice().compareTo(new BigDecimal("50000.00")) <= 0);
    }
}
