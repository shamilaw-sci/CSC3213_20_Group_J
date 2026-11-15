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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminOrderTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock private PaymentRepository paymentRepository;
    @Mock private com.icrowd_api.features.audit.AuditLogRepository auditLogRepository;

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
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.SHIPPED, "admin@icrowd.lk", null);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        verify(orderRepository).save(testOrder);
        verifyNoInteractions(productRepository);
    }

    @Test
    @DisplayName("Admin updates COD order to DELIVERED - marks payment as SUCCESS")
    void testUpdateCodOrderToDeliveredMarksPaymentSuccess() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.DELIVERED, "admin@icrowd.lk", null);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Admin cancels order - releases allocated stock back to inventory")
    void testCancelOrderReleasesStock() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminOrderSummaryDto result = orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@icrowd.lk", null);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(productRepository).atomicIncrementStock(100L, 2);
        assertThat(testOrder.isStockAllocated()).isFalse();
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    void repeatedCancellationDoesNotRestoreStockTwice() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@example.com", null);
        orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@example.com", null);
        verify(productRepository, times(1)).atomicIncrementStock(100L, 2);
        verify(auditLogRepository, times(1)).save(any());
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.EnumSource(value=OrderStatus.class, names={"SHIPPED","DELIVERED","COMPLETED","CHARGEBACK","REVIEW_REQUIRED","REFUNDED"})
    void cannotCancelShippedOrDisputedOrders(OrderStatus status) {
        testOrder.setStatus(status);
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(productRepository, auditLogRepository);
        assertThat(testOrder.isStockAllocated()).isTrue();
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.EnumSource(value=PaymentStatus.class, names={"SUCCESS","PAID","INITIATED","REVIEW_REQUIRED","REFUND_PENDING","CHARGEBACK"})
    void paymentReviewCannotBeBypassedByCancelling(PaymentStatus status) {
        testOrder.setPaymentMethod(PaymentMethod.CARD);
        testOrder.setPaymentStatus(status);
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(productRepository, auditLogRepository);
    }

    @Test
    void unresolvedPaymentAttemptBlocksCancellationEvenIfOrderSummaryIsStale() {
        testOrder.setPaymentMethod(PaymentMethod.CARD);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(paymentRepository.findByOrderId(50L)).thenReturn(List.of(Payment.builder().status(PaymentStatus.INITIATED).build()));
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.CANCELLED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(productRepository, auditLogRepository);
    }

    @Test
    void fulfillmentCannotSkipPaymentOrStockAllocation() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        testOrder.setStockAllocated(false);
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.SHIPPED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        testOrder.setStockAllocated(true);
        testOrder.setPaymentStatus(PaymentStatus.REVIEW_REQUIRED);
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.SHIPPED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void canceledOrderCannotBeReopenedOrFulfillmentMovedBackwards() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        testOrder.setStatus(OrderStatus.CANCELLED);
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.CONFIRMED, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        testOrder.setStatus(OrderStatus.SHIPPED);
        assertThatThrownBy(() -> orderService.updateOrderStatusByAdmin(50L, OrderStatus.PROCESSING, "admin@example.com", null))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(productRepository, auditLogRepository);
    }

    @Test
    void fulfillmentNotesAreRecordedWithTheActor() {
        when(orderRepository.findForUpdate(50L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        orderService.updateOrderStatusByAdmin(50L, OrderStatus.SHIPPED, "admin@example.com", "Courier TEST-123");
        verify(auditLogRepository).save(argThat(entry -> entry.getActorEmail().equals("admin@example.com")
                && entry.getEntityId().equals(50L) && entry.getDetails().contains("Courier TEST-123")));
    }
}
