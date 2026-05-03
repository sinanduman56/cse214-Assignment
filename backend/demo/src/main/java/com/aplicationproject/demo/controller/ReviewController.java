package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.dto.ReviewDto;
import com.aplicationproject.demo.dto.ReviewRequest;
import com.aplicationproject.demo.dto.ReviewStatsDto;
import com.aplicationproject.demo.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewDto>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewDto> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProductId(productId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(reviewService.getReviewsByStoreId(storeId));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<ReviewStatsDto> getStatsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getStatsByProductId(productId));
    }

    /** Kullanıcının bu ürüne yorum yapıp yapamayacağını döner */
    @GetMapping("/can-review/{productId}")
    public ResponseEntity<Map<String, Boolean>> canReview(
            @PathVariable Long productId,
            @RequestParam Long userId) {
        boolean canReview = reviewService.hasUserPurchasedProduct(userId, productId);
        return ResponseEntity.ok(Map.of("canReview", canReview));
    }

    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest request) {
        try {
            return ResponseEntity.ok(reviewService.createReview(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewDto> updateReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    // ── Chatbot analytics endpoints ─────────────────────────────────────────
    @GetMapping("/analytics/most-reviewed")
    public ResponseEntity<List<Map<String, Object>>> mostReviewed(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reviewService.getMostReviewedProducts(limit));
    }

    @GetMapping("/analytics/worst-rated")
    public ResponseEntity<List<Map<String, Object>>> worstRated(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "3") int minReviews) {
        return ResponseEntity.ok(reviewService.getWorstRatedProducts(limit, minReviews));
    }

    @GetMapping("/analytics/best-rated")
    public ResponseEntity<List<Map<String, Object>>> bestRated(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "3") int minReviews) {
        return ResponseEntity.ok(reviewService.getBestRatedProducts(limit, minReviews));
    }
}
