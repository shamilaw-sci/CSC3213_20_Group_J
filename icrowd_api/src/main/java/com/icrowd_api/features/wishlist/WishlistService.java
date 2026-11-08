package com.icrowd_api.features.wishlist;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private WishlistItemRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<WishlistItemDto> getWishlist(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(WishlistItemDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public WishlistItemDto addToWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        return wishlistRepository.findByUserIdAndProductId(user.getId(), productId)
                .map(WishlistItemDto::fromEntity)
                .orElseGet(() -> {
                    WishlistItem item = WishlistItem.builder()
                            .user(user)
                            .product(product)
                            .build();
                    WishlistItem saved = wishlistRepository.save(item);
                    return WishlistItemDto.fromEntity(saved);
                });
    }

    @Transactional
    public void removeFromWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        wishlistRepository.deleteByUserIdAndProductId(user.getId(), productId);
    }
}

