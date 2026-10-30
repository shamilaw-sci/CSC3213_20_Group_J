package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.UserService;
import com.icrowd_api.features.order.dto.CheckoutItemDto;
import com.icrowd_api.features.order.dto.ShippingValidationRequest;
import com.icrowd_api.features.order.dto.ShippingValidationResponse;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private OrderService orderService;

    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockProduct = Product.builder()
                .id(1L)
                .name("Wireless Headset")
                .sku("WH-100")
                .price(new BigDecimal("1500.00"))
                .availableStock(10)
                .isActive(true)
                .build();
    }

    @Test
    void testValidateShippingAndCalculate_StandardDelivery() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        CheckoutItemDto item = new CheckoutItemDto();
        item.setProductId(1L);
        item.setQuantity(2);

        ShippingValidationRequest request = ShippingValidationRequest.builder()
                .recipientName("Nimal Silva")
                .phone("0771234567")
                .email("nimal@example.com")
                .address("123 Galle Road")
                .district("Colombo")
                .latitude(6.9271)
                .longitude(79.8612)
                .deliveryType(DeliveryType.STANDARD)
                .items(List.of(item))
                .build();

        ShippingValidationResponse response = orderService.validateShippingAndCalculate("nimal@example.com", request);

        assertNotNull(response);
        assertTrue(response.isValid());
        assertEquals(new BigDecimal("3000.00"), response.getSubTotal());
        assertEquals(new BigDecimal("200.00"), response.getDeliveryFee());
        assertEquals(new BigDecimal("3200.00"), response.getTotalAmount());
        assertEquals(DeliveryType.STANDARD, response.getDeliveryType());
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("1500.00"), response.getItems().get(0).getUnitPrice());

        // Verify that NO order was persisted in the database during validation
        verify(orderRepository, never()).save(any());
    }

    @Test
    void testValidateShippingAndCalculate_FastDelivery() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        CheckoutItemDto item = new CheckoutItemDto();
        item.setProductId(1L);
        item.setQuantity(1);

        ShippingValidationRequest request = ShippingValidationRequest.builder()
                .recipientName("Nimal Silva")
                .phone("+94771234567")
                .email("nimal@example.com")
                .address("45 Kandy Road")
                .district("Kandy")
                .latitude(7.2906)
                .longitude(80.6337)
                .deliveryType(DeliveryType.FAST)
                .items(List.of(item))
                .build();

        ShippingValidationResponse response = orderService.validateShippingAndCalculate(null, request);

        assertNotNull(response);
        assertTrue(response.isValid());
        assertEquals(new BigDecimal("1500.00"), response.getSubTotal());
        assertEquals(new BigDecimal("500.00"), response.getDeliveryFee());
        assertEquals(new BigDecimal("2000.00"), response.getTotalAmount());
        assertEquals(DeliveryType.FAST, response.getDeliveryType());

        verify(orderRepository, never()).save(any());
    }

    @Test
    void testValidateShipping_InvalidPhone() {
        CheckoutItemDto item = new CheckoutItemDto();
        item.setProductId(1L);
        item.setQuantity(1);

        ShippingValidationRequest request = ShippingValidationRequest.builder()
                .recipientName("Nimal Silva")
                .phone("invalid-phone")
                .email("nimal@example.com")
                .address("123 Galle Road")
                .district("Colombo")
                .deliveryType(DeliveryType.STANDARD)
                .items(List.of(item))
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                orderService.validateShippingAndCalculate(null, request)
        );
    }

    @Test
    void testValidateShipping_OutOfStock() {
        mockProduct.setAvailableStock(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        CheckoutItemDto item = new CheckoutItemDto();
        item.setProductId(1L);
        item.setQuantity(5); // Demands more than 1 in stock

        ShippingValidationRequest request = ShippingValidationRequest.builder()
                .recipientName("Nimal Silva")
                .phone("0771234567")
                .email("nimal@example.com")
                .address("123 Galle Road")
                .district("Colombo")
                .deliveryType(DeliveryType.STANDARD)
                .items(List.of(item))
                .build();

        assertThrows(OutOfStockException.class, () ->
                orderService.validateShippingAndCalculate(null, request)
        );
    }
}
