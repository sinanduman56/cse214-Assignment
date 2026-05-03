package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.model.Order;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.repository.UserRepository;
import com.aplicationproject.demo.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    /** AV-05 fix: Sadece admin tüm siparişleri görebilir */
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.ok(orderService.getAllOrders());
        }
        // Normal kullanıcılar sadece kendi siparişlerini görebilir
        Optional<User> userOpt = userRepository.findByEmail(auth != null ? auth.getName() : "");
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(orderService.getOrdersByUserId(userOpt.get().getId()));
        }
        return ResponseEntity.status(403).build();
    }

    /** AV-05 fix: Sipariş sahipliği doğrulanıyor */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // Admin her siparişi görebilir
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.ok(order);
        }
        // Normal kullanıcı: sadece kendi siparişi
        Optional<User> userOpt = userRepository.findByEmail(auth != null ? auth.getName() : "");
        if (userOpt.isPresent() && order.getUser() != null
                && order.getUser().getId().equals(userOpt.get().getId())) {
            return ResponseEntity.ok(order);
        }
        return ResponseEntity.status(403).build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<Order>> getOrdersByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(orderService.getOrdersByStoreId(storeId));
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @Valid @RequestBody Order order) {
        return ResponseEntity.ok(orderService.updateOrder(id, order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
