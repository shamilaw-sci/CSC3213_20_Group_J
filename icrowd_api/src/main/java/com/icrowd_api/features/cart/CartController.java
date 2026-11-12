package com.icrowd_api.features.cart;

import com.icrowd_api.features.cart.dto.CartResponseDto;
import com.icrowd_api.features.cart.dto.CartSyncRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/sync")
    public ResponseEntity<CartResponseDto> syncCart(Authentication authentication, @RequestBody CartSyncRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        Cart cart = cartService.syncCart(email, request);
        return ResponseEntity.ok(CartResponseDto.fromEntity(cart));
    }

    @GetMapping
    public ResponseEntity<CartResponseDto> getCart(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        Cart cart = cartService.getCart(email);
        return ResponseEntity.ok(CartResponseDto.fromEntity(cart));
    }
}
