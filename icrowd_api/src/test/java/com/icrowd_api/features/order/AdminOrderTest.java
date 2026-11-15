package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.Customer;
import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.order.dto.AdminOrderSummaryDto;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminOrderTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    private Order testOrder;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("customer@example.com")
                .role("CUSTOMER")
                .customer(Customer.builder().firstName("John").lastName("Perera").build())
                .build();

        testProduct = Product.builder()
                .id(100L)
                .name("Wireless Mouse")
                .sku("WM-001")
                .price(new BigDecimal("2500.00"))
                .availableStock(10)
                .build();

        OrderItem item = OrderItem.builder()
                .id(10L)
                .product(testProduct)
                .quantity(2)
                .priceAtTimeOfPurchase(new BigDecimal("2500.00"))
                .build();

        testOrder = Order.builder()
                .id(50L)
                .orderReference("ORD-20261115-00050")
                .user(testUser)
                .shippingFullName("John Perera")
                .shippingEmail("customer@example.com")
                .shippingPhone("0712345678")
                .shippingAddress("123 Galle Road")
                .shippingDistrict("Colombo")
                .deliveryType(DeliveryType.STANDARD)
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.DUE_ON_DELIVERY)
                .subTotal(new BigDecimal("5000.00"))
                .shippingCost(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("5200.00"))
                .stockAllocated(true)
                .items(new ArrayList<>(List.of(item)))
                .build();

        item.setOrder(testOrder);
    }

    @Test
    @DisplayName("Admin updates status to SHIPPED")
    void testUpdateOrderStatusToShipped() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.SHIPPED, "admin@icrowd.lk");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        verify(orderRepository).save(testOrder);
        verifyNoInteractions(productRepository);
    }

    @Test
    @DisplayName("Admin updates COD order to DELIVERED - marks payment as SUCCESS")
    void testUpdateCodOrderToDeliveredMarksPaymentSuccess() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.DELIVERED, "admin@icrowd.lk");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Admin cancels order - releases allocated stock back to inventory")
    void testCancelOrderReleasesStock() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@icrowd.lk");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(productRepository).atomicIncrementStock(100L, 2);
        assertThat(testOrder.isStockAllocated()).isFalse();
    }
}
