package com.icrowd_api.features.cart;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.cart.dto.CartSyncItemDto;
import com.icrowd_api.features.cart.dto.CartSyncRequest;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Cart syncCart(String email, CartSyncRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get existing cart or create a new one
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> Cart.builder().user(user).build());

        // Clear existing items to replace with incoming state
        cart.getItems().clear();

        if (request.getItems() != null) {
            java.util.Set<Long> seen = new java.util.HashSet<>();
            for (CartSyncItemDto itemDto : request.getItems()) {
                if (itemDto == null || itemDto.getProductId() == null || itemDto.getQuantity() == null || itemDto.getQuantity() <= 0)
                    throw new IllegalArgumentException("Positive quantity and product ID are required");
                if (!seen.add(itemDto.getProductId())) throw new IllegalArgumentException("Duplicate cart product");
                Optional<Product> productOpt = productRepository.findById(itemDto.getProductId());
                if (productOpt.isPresent()) {
                    Product product = productOpt.get();
                    if (!Boolean.TRUE.equals(product.getIsActive())) continue;
                    // Carts do not reserve inventory.
                    CartItem cartItem = CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(itemDto.getQuantity())
                            .build();
                    cart.getItems().add(cartItem);
                }
            }
        }

        return cartRepository.save(cart);
    }
    
    @Transactional(readOnly = true)
    public Cart getCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> Cart.builder().user(user).build());
    }
}
