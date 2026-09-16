package com.icrowd_api.features.assistant;

import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private AiChatService aiChatService;

    private List<Product> sampleProducts;

    @BeforeEach
    void setUp() {
        Category headsetCat = Category.builder().id(1L).name("Headset").description("Audio").build();
        Category powerBankCat = Category.builder().id(2L).name("PowerBank").description("Chargers").build();
        Category caseCat = Category.builder().id(3L).name("Case").description("Cases").build();

        Product p1 = Product.builder()
                .id(1L)
                .name("Sony WH-1000XM5 Headset")
                .description("Noise cancelling headphones")
                .category(headsetCat)
                .brand("Sony")
                .price(BigDecimal.valueOf(199.99))
                .availableStock(10)
                .isActive(true)
                .build();

        Product p2 = Product.builder()
                .id(2L)
                .name("Anker PowerCore 20000mAh PowerBank")
                .description("High capacity fast charger")
                .category(powerBankCat)
                .brand("Anker")
                .price(BigDecimal.valueOf(49.99))
                .availableStock(15)
                .isActive(true)
                .build();

        Product p3 = Product.builder()
                .id(3L)
                .name("MagSafe Silicone Case")
                .description("Protective shockproof case")
                .category(caseCat)
                .brand("Apple")
                .price(BigDecimal.valueOf(29.99))
                .availableStock(20)
                .isActive(true)
                .build();

        sampleProducts = List.of(p1, p2, p3);
    }

    @Test
    void testGreetingMessage() {
        when(productRepository.findAllActiveProductsList()).thenReturn(sampleProducts);

        AiChatRequest request = new AiChatRequest("session1", "hello");
        AiChatResponse response = aiChatService.processMessage(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("ආයුබෝවන්"));
        assertFalse(response.getProducts().isEmpty());
    }

    @Test
    void testBudgetPhoneQuery() {
        when(productRepository.findAllActiveProductsList()).thenReturn(sampleProducts);

        AiChatRequest request = new AiChatRequest("session1", "mata 50000ka phone ekk gnna one monawada thiyana brands");
        AiChatResponse response = aiChatService.processMessage(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("50,000"));
        assertTrue(response.getReply().contains("Redmi") || response.getReply().contains("Samsung"));
        assertFalse(response.getProducts().isEmpty());
    }

    @Test
    void testCategorySearchHeadset() {
        when(productRepository.findAllActiveProductsList()).thenReturn(sampleProducts);

        AiChatRequest request = new AiChatRequest("session1", "Can you show me headsets?");
        AiChatResponse response = aiChatService.processMessage(request);

        assertNotNull(response);
        assertEquals(1, response.getProducts().size());
        assertEquals("Sony WH-1000XM5 Headset", response.getProducts().get(0).getName());
    }

    @Test
    void testDeliveryFaq() {
        AiChatRequest request = new AiChatRequest("session1", "delivery timeframes");
        AiChatResponse response = aiChatService.processMessage(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Delivery"));
    }

    @Test
    void testWarrantyFaq() {
        AiChatRequest request = new AiChatRequest("session1", "What is the warranty?");
        AiChatResponse response = aiChatService.processMessage(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Warranty"));
    }
}
