package com.icrowd_api.features.wishlist;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<?> getWishlist(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        List<WishlistItemDto> items = wishlistService.getWishlist(authentication.getName());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> addToWishlist(Authentication authentication, @PathVariable Long productId) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        WishlistItemDto item = wishlistService.addToWishlist(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Added to wishlist", "item", item));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(Authentication authentication, @PathVariable Long productId) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        wishlistService.removeFromWishlist(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
    }
}

