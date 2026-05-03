package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/admin/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        return ResponseEntity.ok(analyticsService.getAdminDashboard());
    }

    @GetMapping("/store/{storeId}/dashboard")
    public ResponseEntity<Map<String, Object>> getStoreDashboard(@PathVariable Long storeId) {
        return ResponseEntity.ok(analyticsService.getStoreDashboard(storeId));
    }

    @GetMapping("/store/{storeId}/customers")
    public ResponseEntity<Map<String, Object>> getStoreCustomers(@PathVariable Long storeId) {
        return ResponseEntity.ok(analyticsService.getStoreCustomerSegmentation(storeId));
    }

    @GetMapping("/store/{storeId}/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueDrillDown(
            @PathVariable Long storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getRevenueDrillDown(storeId, from, to));
    }

    @GetMapping("/admin/stores/comparison")
    public ResponseEntity<List<Map<String, Object>>> getCrossStoreComparison() {
        return ResponseEntity.ok(analyticsService.getCrossStoreComparison());
    }

    @GetMapping("/user/{userId}/spending")
    public ResponseEntity<Map<String, Object>> getUserSpending(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getUserSpendingAnalytics(userId));
    }
}
