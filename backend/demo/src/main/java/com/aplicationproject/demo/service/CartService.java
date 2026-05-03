package com.aplicationproject.demo.service;

import com.aplicationproject.demo.exception.ResourceNotFoundException;
import com.aplicationproject.demo.model.*;
import com.aplicationproject.demo.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + userId));
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    @Transactional
    public Cart addItemToCart(Long userId, Long productId, int quantity) {
        Cart cart = getCartByUserId(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + productId));

        // Check if product already in cart
        for (CartItem item : cart.getItems()) {
            if (item.getProduct().getId().equals(productId)) {
                item.setQuantity(item.getQuantity() + quantity);
                return cartRepository.save(cart);
            }
        }

        CartItem cartItem = new CartItem();
        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setQuantity(quantity);
        cart.getItems().add(cartItem);

        return cartRepository.save(cart);
    }

    @Transactional
    public Cart updateItemQuantity(Long userId, Long itemId, int quantity) {
        Cart cart = getCartByUserId(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Sepet ürünü bulunamadı: " + itemId));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(quantity);
        }
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart removeItemFromCart(Long userId, Long itemId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        return cartRepository.save(cart);
    }

    @Transactional
    public Order checkout(Long userId, String paymentMethod) {
        Cart cart = getCartByUserId(userId);

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Sepet boş, sipariş oluşturulamaz.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + userId));

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");
        order.setOrderDate(LocalDateTime.now());
        order.setGrandTotal(cart.getTotalPrice());
        order.setPaymentMethod(paymentMethod);
        order.setOrderItems(new ArrayList<>());

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(cartItem.getProduct().getUnitPrice());
            order.getOrderItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // Her ürün için stoku düş
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            int current = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            product.setStockQuantity(Math.max(0, current - cartItem.getQuantity()));
            productRepository.save(product);
        }

        // Clear the cart after checkout
        cart.getItems().clear();
        cartRepository.save(cart);

        return savedOrder;
    }
}
