package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.model.Cart;
import com.aplicationproject.demo.model.Order;
import com.aplicationproject.demo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping("/{userId}/items")
    public ResponseEntity<Cart> addItem(
            @PathVariable Long userId,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "1") int quantity) {
        return ResponseEntity.ok(cartService.addItemToCart(userId, productId, quantity));
    }

    @PutMapping("/{userId}/items/{itemId}")
    public ResponseEntity<Cart> updateItem(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(userId, itemId, quantity));
    }

    @DeleteMapping("/{userId}/items/{itemId}")
    public ResponseEntity<Cart> removeItem(@PathVariable Long userId, @PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(userId, itemId));
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Cart> clearCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.clearCart(userId));
    }

    @PostMapping("/{userId}/checkout")
    public ResponseEntity<Order> checkout(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        String paymentMethod = body != null ? body.getOrDefault("paymentMethod", "CREDIT_CARD") : "CREDIT_CARD";
        return ResponseEntity.ok(cartService.checkout(userId, paymentMethod));
    }
}
