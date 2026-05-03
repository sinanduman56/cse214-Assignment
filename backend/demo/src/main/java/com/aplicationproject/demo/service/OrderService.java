  
package com.aplicationproject.demo.service;

import com.aplicationproject.demo.exception.ResourceNotFoundException;
import com.aplicationproject.demo.model.Order;
import com.aplicationproject.demo.model.OrderItem;
import com.aplicationproject.demo.model.Product;
import com.aplicationproject.demo.repository.OrderRepository;
import com.aplicationproject.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş bulunamadı, id: " + id));
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getOrdersByStoreId(Long storeId) {
        return orderRepository.findByStoreId(storeId);
    }

    @Transactional
    public Order createOrder(Order order) {
        Order saved = orderRepository.save(order);
        // Her sipariş kalemi için stok düş
        if (saved.getOrderItems() != null) {
            for (OrderItem item : saved.getOrderItems()) {
                if (item.getProduct() != null) {
                    productRepository.findById(item.getProduct().getId()).ifPresent(product -> {
                        int current = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        product.setStockQuantity(Math.max(0, current - qty));
                        productRepository.save(product);
                    });
                }
            }
        }
        return saved;
    }

    public Order updateOrder(Long id, Order orderDetails) {
        Order order = getOrderById(id);
        order.setStatus(orderDetails.getStatus());
        order.setGrandTotal(orderDetails.getGrandTotal());
        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Long id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
}