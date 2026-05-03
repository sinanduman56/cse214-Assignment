package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.dto.ReviewDto;
import com.aplicationproject.demo.dto.ReviewRequest;
import com.aplicationproject.demo.dto.StoreSummaryDto;
import com.aplicationproject.demo.dto.UserSummaryDto;
import com.aplicationproject.demo.model.AuditLog;
import com.aplicationproject.demo.model.Store;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.service.AuditLogService;
import com.aplicationproject.demo.service.OrderService;
import com.aplicationproject.demo.service.ReviewService;
import com.aplicationproject.demo.service.StoreService;
import com.aplicationproject.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final StoreService storeService;
    private final OrderService orderService;
    private final AuditLogService auditLogService;
    private final ReviewService reviewService;

    // ---- User Management ----

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUserSummaries());
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<User> suspendUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setUserActive(id, false));
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<User> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setUserActive(id, true));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Store Management (Open/Close) ----

    @GetMapping("/stores")
    public ResponseEntity<List<StoreSummaryDto>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStoreSummaries());
    }

    @PutMapping("/stores/{id}/open")
    public ResponseEntity<Store> openStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.setStoreActive(id, true));
    }

    @PutMapping("/stores/{id}/close")
    public ResponseEntity<Store> closeStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.setStoreActive(id, false));
    }

    // ---- Platform Analytics ----

    @GetMapping("/analytics/summary")
    public ResponseEntity<Map<String, Object>> getPlatformSummary() {
        return ResponseEntity.ok(userService.getPlatformSummary());
    }

    // ---- Audit Logs ----

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(page, size));
    }

    // ---- Review Management (satın alma kontrolü olmadan ekleme) ----

    /**
     * Admin olarak herhangi bir kullanıcı-ürün kombinasyonu için yorum ekler.
     * Satın alma zorunluluğu yoktur — test/seed verisi için kullanın.
     */
    @PostMapping("/reviews")
    public ResponseEntity<ReviewDto> addReviewAsAdmin(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReviewAsAdmin(request));
    }
}
