package com.aplicationproject.demo.service;

import com.aplicationproject.demo.exception.ResourceNotFoundException;
import com.aplicationproject.demo.dto.UserSummaryDto;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.repository.UserRepository;
import com.aplicationproject.demo.repository.OrderRepository;
import com.aplicationproject.demo.repository.StoreRepository;
import com.aplicationproject.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<UserSummaryDto> getAllUserSummaries() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getEmail(), u.getRoleType(), u.getGender(), u.isActive()))
                .collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı, id: " + id));
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        user.setEmail(userDetails.getEmail());
        user.setGender(userDetails.getGender());
        user.setRoleType(userDetails.getRoleType());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    public User setUserActive(Long id, boolean active) {
        User user = getUserById(id);
        user.setActive(active);
        return userRepository.save(user);
    }

    public Map<String, Object> getPlatformSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers", userRepository.count());
        summary.put("totalOrders", orderRepository.count());
        summary.put("totalStores", storeRepository.count());
        summary.put("totalProducts", productRepository.count());
        return summary;
    }
}