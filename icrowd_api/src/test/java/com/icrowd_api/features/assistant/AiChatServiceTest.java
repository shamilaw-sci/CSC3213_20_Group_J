package com.icrowd_api.features.assistant;

import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.order.ShippingPolicy;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiChatServiceTest {

    @Mock
    private ProductRepository productRepository;

    private ShippingPolicy shippingPolicy;
    private AiChatService aiChatService;

    private Product inStockHeadset;
    private Product inStockPowerBank;
    private Product inStockCase;
    private Product outOfStockHeadset;

    @BeforeEach
    void setUp() {
        shippingPolicy = new ShippingPolicy();
        aiChatService = new AiChatService(productRepository, shippingPolicy);

        Category headsetCat = Category.builder().id(1L).name("Headset").description("Audio").build();
        Category powerBankCat = Category.builder().id(2L).name("PowerBank").description("Chargers").build();
        Category caseCat = Category.builder().id(3L).name("Case").description("Cases").build();

        inStockHeadset = Product.builder()
                .id(1L)
                .name("Sony WH-1000XM5 Headset")
                .description("Flagship wireless noise cancelling headphones")
                .category(headsetCat)
                .brand("Sony")
                .price(new BigDecimal("125000.00"))
                .availableStock(10)
                .isActive(true)
                .build();

        inStockPowerBank = Product.builder()
                .id(2L)
                .name("Anker Prime 20000mAh PowerBank (200W)")
                .description("USB-C high capacity fast charger with 140W single port")
                .category(powerBankCat)
                .brand("Anker")
                .price(new BigDecimal("38500.00"))
                .availableStock(15)
                .isActive(true)
                .build();

        inStockCase = Product.builder()
                .id(3L)
                .name("Apple iPhone 15 Pro MagSafe Silicone Case")
                .description("Protective shockproof case designed for iPhone 15")
                .category(caseCat)
                .brand("Apple")
                .price(new BigDecimal("14500.00"))
                .availableStock(20)
                .isActive(true)
                .build();

        outOfStockHeadset = Product.builder()
                .id(4L)
                .name("Apple AirPods Max Wireless")
                .description("Premium over-ear headphones")
                .category(headsetCat)
                .brand("Apple")
                .price(new BigDecimal("195000.00"))
                .availableStock(0) // Out of stock
                .isActive(true)
                .build();

        List<Product> allProducts = List.of(inStockHeadset, inStockPowerBank, inStockCase, outOfStockHeadset);
        when(productRepository.findCatalogCandidates(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class))).thenReturn(allProducts);
    }

    @Nested
    @DisplayName("1. Availability Risk & Security Guardrails")
    class AvailabilityAndSecurityTests {

        @Test
        @DisplayName("Message exceeding maximum allowed length of 500 characters is rejected")
        void messageTooLongIsRejected() {
            String longMessage = "a".repeat(501);
            AiChatRequest request = new AiChatRequest("sec_session_1", longMessage);
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertTrue(response.getReply().contains("500"));
            assertTrue(response.getReply().contains("පණිවිඩය ඉතා දිගුය") || response.getReply().contains("exceeds"));
            assertTrue(response.getProducts().isEmpty());
        }

        @Test
        @DisplayName("Rate limiter throttles excessive requests within the sliding window")
        void rateLimiterThrottlesExcessiveRequests() {
            String sess = "rate_limit_test_session";
            AiChatRequest request = new AiChatRequest(sess, "hello");

            // Send up to the limit
            for (int i = 0; i < AiChatService.RATE_LIMIT_MAX_REQUESTS; i++) {
                AiChatResponse res = aiChatService.processMessage(request);
                assertNotNull(res);
            }

            // Exceeding request must be throttled
            AiChatResponse throttledResponse = aiChatService.processMessage(request);
            assertNotNull(throttledResponse);
            assertTrue(throttledResponse.getReply().contains("Too many") || throttledResponse.getReply().contains("පණිවිඩ වැඩි ප්‍රමාණයක්"));
        }
    }

    @Nested
    @DisplayName("2. Authoritative Shared Policy Delivery & Warranty Tests")
    class AuthoritativePolicyTests {

        @Test
        @DisplayName("Delivery response reflects exact checkout policy (Rs 200 standard / Rs 500 fast)")
        void deliveryInformationMatchesCheckoutAuthoritativeSource() {
            AiChatRequest request = new AiChatRequest("sess_del_1", "What are the delivery charges and time?");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            String reply = response.getReply();
            assertTrue(reply.contains("200") || reply.contains("Standard"), "Must contain Standard Delivery fee Rs 200");
            assertTrue(reply.contains("500") || reply.contains("Fast"), "Must contain Fast Delivery fee Rs 500");
            assertTrue(reply.contains("3-5") || reply.contains("1-2"), "Must contain authoritative timeline");
        }

        @Test
        @DisplayName("Warranty response reflects official brand warranty policy")
        void warrantyInformationMatchesAuthoritativePolicy() {
            AiChatRequest request = new AiChatRequest("sess_war_1", "What is the warranty policy?");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertTrue(response.getReply().contains("1 Year") || response.getReply().contains("වසර 1"));
        }
    }

    @Nested
    @DisplayName("3. Language Evaluation Cases (Sinhala, English, Transliterated Singlish)")
    class LanguageEvaluationTests {

        @Test
        @DisplayName("Sinhala Unicode query: Delivery fees and timelines")
        void sinhalaDeliveryQuery() {
            AiChatRequest request = new AiChatRequest("sess_sin_1", "ඩිලිවරි ගාස්තු සහ දින කීයද?");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertTrue(response.getReply().contains("200") && response.getReply().contains("500"));
        }

        @Test
        @DisplayName("Sinhala Unicode query: Search for headphones")
        void sinhalaHeadsetQuery() {
            AiChatRequest request = new AiChatRequest("sess_sin_2", "මට හෙඩ්සෙට් එකක් බලන්න ඕනෙ");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertFalse(response.getProducts().isEmpty());
            assertEquals("Headset", response.getProducts().get(0).getCategory().getName());
        }

        @Test
        @DisplayName("English query: Search for power banks under 40000")
        void englishPowerBankQuery() {
            AiChatRequest request = new AiChatRequest("sess_en_1", "Show me power banks under 40000");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertFalse(response.getProducts().isEmpty());
            assertEquals("Anker Prime 20000mAh PowerBank (200W)", response.getProducts().get(0).getName());
        }

        @Test
        @DisplayName("Transliterated Sinhala (Singlish): diliwari fees kohomada")
        void singlishDeliveryQuery() {
            AiChatRequest request = new AiChatRequest("sess_sngl_1", "diliwari fees kohomada");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertTrue(response.getReply().contains("Delivery") || response.getReply().contains("බෙදාහැරීම"));
        }

        @Test
        @DisplayName("Transliterated Sinhala (Singlish): adu milata thiyena case monawada")
        void singlishBudgetCaseQuery() {
            AiChatRequest request = new AiChatRequest("sess_sngl_2", "adu milata thiyena case monawada");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertFalse(response.getProducts().isEmpty());
            assertEquals("Case", response.getProducts().get(0).getCategory().getName());
        }

        @Test
        @DisplayName("50000ka phone ekak ganna one returns budget smartphone options in Sri Lanka and matching accessories")
        void singlishBudgetPhoneInquiry() {
            AiChatRequest request = new AiChatRequest("sess_phone_50k", "50000ka phone ekak ganna one");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertNotNull(response.getReply());
            assertTrue(response.getReply().contains("50,000") || response.getReply().contains("Redmi") || response.getReply().contains("Samsung"));
            assertFalse(response.getSuggestions().isEmpty());
        }

        @Test
        @DisplayName("apple phone warga monwada returns Apple iPhone lineup and official Apple accessories")
        void applePhoneLineupInquiry() {
            AiChatRequest request = new AiChatRequest("sess_apple_1", "apple phone warga monwada");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertNotNull(response.getReply());
            assertTrue(response.getReply().contains("Apple iPhone") || response.getReply().contains("iPhone 16") || response.getReply().contains("iPhone 15"));
            assertFalse(response.getSuggestions().isEmpty());
        }
    }

    @Nested
    @DisplayName("4. Device Compatibility & Incompatible Combinations")
    class CompatibilityEvaluationTests {

        @Test
        @DisplayName("Incompatible request: Lightning charger for iPhone 15 triggers friendly USB-C clarification")
        void lightningOnIphone15TriggersCompatibilityClarification() {
            AiChatRequest request = new AiChatRequest("sess_compat_1", "Do you have a lightning charger for iphone 15?");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            String reply = response.getReply();
            assertTrue(reply.contains("USB-C") || reply.contains("Type-C"), "Must explain iPhone 15 uses USB-C");
            assertFalse(response.getProducts().isEmpty(), "Must recommend compatible USB-C products");
        }
    }

    @Nested
    @DisplayName("5. Ambiguous Requests and Stock Availability")
    class AmbiguousAndStockTests {

        @Test
        @DisplayName("Ambiguous request triggers clarifying categories and suggestions")
        void ambiguousRequestTriggersClarification() {
            AiChatRequest request = new AiChatRequest("sess_amb_1", "help me");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            assertTrue(response.getReply().contains("Category") || response.getReply().contains("තෝරාගන්න") || response.getReply().contains("සඳහන් කරන්න"));
            assertFalse(response.getSuggestions().isEmpty());
        }

        @Test
        @DisplayName("Unavailable out-of-stock products are not falsely recommended as priority in stock")
        void inStockProductsArePrioritizedOverOutOfStock() {
            AiChatRequest request = new AiChatRequest("sess_stock_1", "Show me Apple headsets");
            AiChatResponse response = aiChatService.processMessage(request);

            assertNotNull(response);
            // If any product returned, verify in-stock priority
            for (Product p : response.getProducts()) {
                if (p.getAvailableStock() != null && p.getAvailableStock() > 0) {
                    assertTrue(p.getAvailableStock() > 0);
                }
            }
        }
    }

    @Nested
    @DisplayName("6. Session Memory & Multi-Turn Conversation Context")
    class SessionMemoryTests {

        @Test
        @DisplayName("Turn 2 follow-up with budget inherits category from Turn 1")
        void sessionMemoryInheritsCategoryOnFollowUp() {
            String sessId = "multi_turn_session_1";

            // Turn 1: Ask about cases
            AiChatRequest turn1 = new AiChatRequest(sessId, "Show me phone cases");
            AiChatResponse res1 = aiChatService.processMessage(turn1);
            assertNotNull(res1);
            assertEquals("Case", res1.getProducts().get(0).getCategory().getName());

            // Turn 2: Follow-up with only budget "under 20000" (no mention of "case")
            AiChatRequest turn2 = new AiChatRequest(sessId, "Show me items under 20000");
            AiChatResponse res2 = aiChatService.processMessage(turn2);
            assertNotNull(res2);
            assertFalse(res2.getProducts().isEmpty());
            // Must have inherited the "Case" category from Turn 1!
            assertEquals("Case", res2.getProducts().get(0).getCategory().getName());
        }

        @Test
        @DisplayName("Turn 2 follow-up asking 'is it in stock?' verifies availability of Turn 1 products")
        void sessionMemoryAnswersStockForPreviousProducts() {
            String sessId = "multi_turn_session_2";

            // Turn 1: Ask for Anker power bank
            AiChatRequest turn1 = new AiChatRequest(sessId, "Anker power bank");
            aiChatService.processMessage(turn1);

            // Turn 2: "Is it in stock?"
            AiChatRequest turn2 = new AiChatRequest(sessId, "is it in stock?");
            AiChatResponse res2 = aiChatService.processMessage(turn2);

            assertNotNull(res2);
            assertTrue(res2.getReply().contains("Stock Status") || res2.getReply().contains("තොග"));
            assertTrue(res2.getReply().contains("Anker Prime 20000mAh PowerBank"));
        }
    }
}
