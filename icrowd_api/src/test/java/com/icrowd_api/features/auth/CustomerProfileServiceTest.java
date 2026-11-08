package com.icrowd_api.features.auth;

import com.icrowd_api.features.auth.dto.AddressDto;
import com.icrowd_api.features.order.Order;
import com.icrowd_api.features.order.OrderItem;
import com.icrowd_api.features.order.OrderRepository;
import com.icrowd_api.features.order.OrderService;
import com.icrowd_api.features.order.OrderStatus;
import com.icrowd_api.features.order.dto.CustomerOrderResponseDto;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.wishlist.WishlistItem;
import com.icrowd_api.features.wishlist.WishlistItemDto;
import com.icrowd_api.features.wishlist.WishlistItemRepository;
import com.icrowd_api.features.wishlist.WishlistService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class CustomerProfileServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private WishlistItemRepository wishlistRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private UserService userService;

    @InjectMocks
    private OrderService orderService;

    @InjectMocks
    private WishlistService wishlistService;

    @Test
    void testSetDefaultCustomerAddressAtomicity() {
        String email = "customer@test.com";
        Customer customer = Customer.builder().id(1L).firstName("Test").lastName("Customer").build();
        Address addr1 = Address.builder().id(101L).customer(customer).addressLine1("Addr 1").city("Colombo").isDefault(false).build();

        Mockito.when(customerRepository.findByUserEmailWithLock(email)).thenReturn(Optional.of(customer));
        Mockito.when(addressRepository.findByIdAndCustomerUserEmail(101L, email)).thenReturn(Optional.of(addr1));
        Mockito.when(addressRepository.save(any(Address.class))).thenAnswer(i -> i.getArgument(0));

        AddressDto result = userService.setDefaultCustomerAddress(email, 101L);

        assertNotNull(result);
        assertTrue(result.getIsDefault());
        verify(addressRepository).clearDefaultAddressesForCustomer(1L);
        verify(addressRepository).save(addr1);
    }

    @Test
    void testDeleteDefaultAddressPromotesRemainingAddress() {
        String email = "customer@test.com";
        Customer customer = Customer.builder().id(1L).firstName("Test").lastName("Customer").build();
        Address defaultAddr = Address.builder().id(101L).customer(customer).addressLine1("Old Default").city("Colombo").isDefault(true).build();
        Address remainingAddr = Address.builder().id(102L).customer(customer).addressLine1("Second").city("Kandy").isDefault(false).build();

        Mockito.when(customerRepository.findByUserEmailWithLock(email)).thenReturn(Optional.of(customer));
        Mockito.when(addressRepository.findByIdAndCustomerUserEmail(101L, email)).thenReturn(Optional.of(defaultAddr));
        Mockito.when(addressRepository.findByCustomerId(1L)).thenReturn(List.of(remainingAddr));

        userService.deleteCustomerAddress(email, 101L);

        verify(addressRepository).delete(defaultAddr);
        assertTrue(remainingAddr.getIsDefault());
        verify(addressRepository).save(remainingAddr);
    }

    @Test
    void testGetCustomerOrdersScoping() {
        String email = "customer@test.com";
        User user = User.builder().id(20L).email(email).build();
        Product product = Product.builder().id(5L).name("Keyboard").price(BigDecimal.valueOf(5000)).build();

        Order order = Order.builder()
                .id(1L)
                .orderReference("ORD-202611-0001")
                .user(user)
                .status(OrderStatus.COMPLETED)
                .totalAmount(BigDecimal.valueOf(5000))
                .currency("LKR")
                .shippingAddress("123 Galle Rd")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder().id(1L).order(order).product(product).quantity(1).priceAtTimeOfPurchase(BigDecimal.valueOf(5000)).build();
        order.getItems().add(item);

        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        Mockito.when(orderRepository.findByUserIdOrderByCreatedAtDesc(20L)).thenReturn(List.of(order));

        List<CustomerOrderResponseDto> orders = orderService.getCustomerOrders(email);

        assertNotNull(orders);
        assertEquals(1, orders.size());
        assertEquals("ORD-202611-0001", orders.get(0).getOrderReference());
        assertEquals("delivered", orders.get(0).getStatusCategory());
        assertEquals(1, orders.get(0).getItems().size());
        assertEquals("Keyboard", orders.get(0).getItems().get(0).getTitle());
    }

    @Test
    void testWishlistAddAndRetrieve() {
        String email = "customer@test.com";
        User user = User.builder().id(30L).email(email).build();
        Product product = Product.builder().id(77L).name("Wireless Mouse").price(BigDecimal.valueOf(2500)).build();
        WishlistItem item = WishlistItem.builder().id(1L).user(user).product(product).createdAt(LocalDateTime.now()).build();

        Mockito.when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        Mockito.when(productRepository.findById(77L)).thenReturn(Optional.of(product));
        Mockito.when(wishlistRepository.findByUserIdAndProductId(30L, 77L)).thenReturn(Optional.empty());
        Mockito.when(wishlistRepository.save(any(WishlistItem.class))).thenReturn(item);

        WishlistItemDto added = wishlistService.addToWishlist(email, 77L);
        assertNotNull(added);
        assertEquals(77L, added.getProduct().getId());
        assertEquals("Wireless Mouse", added.getProduct().getName());

        Mockito.when(wishlistRepository.findByUserIdOrderByCreatedAtDesc(30L)).thenReturn(List.of(item));
        List<WishlistItemDto> list = wishlistService.getWishlist(email);
        assertEquals(1, list.size());
        assertEquals(77L, list.get(0).getProduct().getId());
    }
}

