package com.icrowd_api.features.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderStatusConverterTest {

    private OrderStatusConverter converter;

    @BeforeEach
    void setUp() {
        converter = new OrderStatusConverter();
    }

    @Test
    @DisplayName("Converts PENDING_PAYMENT string correctly to enum")
    void testConvertPendingPayment() {
        assertEquals(OrderStatus.PENDING_PAYMENT, converter.convertToEntityAttribute("PENDING_PAYMENT"));
    }

    @Test
    @DisplayName("Converts lowercase and spaced status strings safely")
    void testConvertCaseInsensitiveAndSpaces() {
        assertEquals(OrderStatus.PENDING_PAYMENT, converter.convertToEntityAttribute("pending_payment"));
        assertEquals(OrderStatus.PENDING_PAYMENT, converter.convertToEntityAttribute("pending payment"));
        assertEquals(OrderStatus.DELIVERED, converter.convertToEntityAttribute("delivered"));
        assertEquals(OrderStatus.SHIPPED, converter.convertToEntityAttribute("SHIPPED"));
    }

    @Test
    @DisplayName("Falls back safely to PENDING when unknown status is encountered")
    void testFallbackForUnknownStatus() {
        assertEquals(OrderStatus.PENDING, converter.convertToEntityAttribute("UNKNOWN_STATUS_VALUE"));
        assertEquals(OrderStatus.PENDING, converter.convertToEntityAttribute(null));
        assertEquals(OrderStatus.PENDING, converter.convertToEntityAttribute("   "));
    }

    @Test
    @DisplayName("Converts enum to database string correctly")
    void testConvertToDatabaseColumn() {
        assertEquals("PENDING_PAYMENT", converter.convertToDatabaseColumn(OrderStatus.PENDING_PAYMENT));
        assertEquals("DELIVERED", converter.convertToDatabaseColumn(OrderStatus.DELIVERED));
        assertEquals("PENDING", converter.convertToDatabaseColumn(null));
    }
}
