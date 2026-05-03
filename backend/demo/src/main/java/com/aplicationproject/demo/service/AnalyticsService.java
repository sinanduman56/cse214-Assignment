package com.aplicationproject.demo.service;

import com.aplicationproject.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ReviewRepository reviewRepository;
    private final CustomerProfileRepository customerProfileRepository;

    // ---- Admin: Platform-wide analytics ----
    public Map<String, Object> getAdminDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalUsers", userRepository.count());
        dashboard.put("totalOrders", orderRepository.count());
        dashboard.put("totalProducts", productRepository.count());
        dashboard.put("totalStores", storeRepository.count());
        dashboard.put("totalReviews", reviewRepository.count());
        return dashboard;
    }

    // ---- Corporate: Store-specific analytics ----
    public Map<String, Object> getStoreDashboard(Long storeId) {
        Map<String, Object> dashboard = new HashMap<>();
        long productCount = productRepository.findByStoreId(storeId).size();
        dashboard.put("totalProducts", productCount);

        List<Object[]> storeStats = orderRepository.getStoreOrderStats(storeId);
        if (!storeStats.isEmpty()) {
            Object[] stats = storeStats.get(0);
            dashboard.put("totalOrders", stats[0]);
            dashboard.put("totalRevenue", stats[1]);
        } else {
            dashboard.put("totalOrders", 0);
            dashboard.put("totalRevenue", BigDecimal.ZERO);
        }

        return dashboard;
    }

    // ---- Corporate: Customer segmentation for a store ----
    public Map<String, Object> getStoreCustomerSegmentation(Long storeId) {
        Map<String, Object> result = new HashMap<>();

        List<Object[]> cityRows = customerProfileRepository.getCustomersByCity(storeId);
        Map<String, Long> byCity = new LinkedHashMap<>();
        for (Object[] row : cityRows) {
            byCity.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        result.put("byCity", byCity);

        List<Object[]> membershipRows = customerProfileRepository.getCustomersByMembership(storeId);
        Map<String, Long> byMembership = new LinkedHashMap<>();
        for (Object[] row : membershipRows) {
            byMembership.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        result.put("byMembership", byMembership);

        return result;
    }

    // ---- Individual: Personal spending analytics ----
    public Map<String, Object> getUserSpendingAnalytics(Long userId) {
        Map<String, Object> analytics = new HashMap<>();
        List<Object[]> userStats = orderRepository.getUserOrderStats(userId);
        if (!userStats.isEmpty()) {
            Object[] stats = userStats.get(0);
            analytics.put("totalOrders", stats[0]);
            analytics.put("totalSpent", stats[1]);
        } else {
            analytics.put("totalOrders", 0);
            analytics.put("totalSpent", BigDecimal.ZERO);
        }
        analytics.put("totalReviews", reviewRepository.findByUserId(userId).size());
        return analytics;
    }

    // ---- Corporate: Revenue drill-down with date filter ----
    public Map<String, Object> getRevenueDrillDown(Long storeId, LocalDate from, LocalDate to) {
        Map<String, Object> result = new HashMap<>();

        List<Object[]> byProduct = orderRepository.getRevenueByProduct(storeId, from, to);
        Map<String, Number> productRevenue = new LinkedHashMap<>();
        for (Object[] row : byProduct) {
            productRevenue.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        result.put("byProduct", productRevenue);

        List<Object[]> daily = orderRepository.getDailyRevenue(storeId, from, to);
        Map<String, Number> dailyRevenue = new LinkedHashMap<>();
        for (Object[] row : daily) {
            dailyRevenue.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        result.put("daily", dailyRevenue);

        return result;
    }

    // ---- Admin: Cross-store comparison ----
    public List<Map<String, Object>> getCrossStoreComparison() {
        return storeRepository.findAll().stream().map(store -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("storeId", store.getId());
            item.put("storeName", store.getName());
            List<Object[]> stats = orderRepository.getStoreOrderStats(store.getId());
            if (!stats.isEmpty()) {
                Object[] s = stats.get(0);
                item.put("totalOrders", ((Number) s[0]).longValue());
                item.put("totalRevenue", s[1]);
            } else {
                item.put("totalOrders", 0L);
                item.put("totalRevenue", BigDecimal.ZERO);
            }
            item.put("totalProducts", productRepository.findByStoreId(store.getId()).size());
            return item;
        }).toList();
    }
}
