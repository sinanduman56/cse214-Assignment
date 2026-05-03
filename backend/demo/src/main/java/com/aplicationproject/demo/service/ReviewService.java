package com.aplicationproject.demo.service;

import com.aplicationproject.demo.dto.ReviewDto;
import com.aplicationproject.demo.dto.ReviewRequest;
import com.aplicationproject.demo.dto.ReviewStatsDto;
import com.aplicationproject.demo.exception.ResourceNotFoundException;
import com.aplicationproject.demo.model.Product;
import com.aplicationproject.demo.model.Review;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.repository.OrderItemRepository;
import com.aplicationproject.demo.repository.ProductRepository;
import com.aplicationproject.demo.repository.ReviewRepository;
import com.aplicationproject.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    // ── Mapping ────────────────────────────────────────────────────────────
    private ReviewDto toDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .starRating(r.getStarRating())
                .content(r.getContent())
                .helpfulVotes(r.getHelpfulVotes())
                .totalVotes(r.getTotalVotes())
                .userId(r.getUser().getId())
                .userEmail(r.getUser().getEmail())
                .productId(r.getProduct().getId())
                .productName(r.getProduct().getName())
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ── CRUD ───────────────────────────────────────────────────────────────
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public ReviewDto getReviewById(Long id) {
        return toDto(reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yorum bulunamadı: " + id)));
    }

    public List<ReviewDto> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ReviewDto> getReviewsByStoreId(Long storeId) {
        return reviewRepository.findByStoreId(storeId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Returns true if the user has a delivered/shipped order containing this product */
    public boolean hasUserPurchasedProduct(Long userId, Long productId) {
        return orderItemRepository.existsByUserAndProduct(userId, productId);
    }

    @Transactional
    public ReviewDto createReview(ReviewRequest request) {
        if (!hasUserPurchasedProduct(request.getUserId(), request.getProductId())) {
            throw new IllegalArgumentException("Bu ürünü satın almadan yorum yapamazsınız.");
        }
        return saveReview(request);
    }

    /** Admin tarafından kullanılır — satın alma kontrolü yapılmaz */
    @Transactional
    public ReviewDto createReviewAsAdmin(ReviewRequest request) {
        return saveReview(request);
    }

    private ReviewDto saveReview(ReviewRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + request.getUserId()));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı: " + request.getProductId()));

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setStarRating(request.getStarRating());
        review.setContent(request.getContent());
        review.setHelpfulVotes(0);
        review.setTotalVotes(0);

        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public ReviewDto updateReview(Long id, ReviewRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yorum bulunamadı: " + id));
        review.setContent(request.getContent());
        review.setStarRating(request.getStarRating());
        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yorum bulunamadı: " + id));
        reviewRepository.delete(review);
    }

    // ── Stats ──────────────────────────────────────────────────────────────
    public ReviewStatsDto getStatsByProductId(Long productId) {
        long count = reviewRepository.countByProductId(productId);
        Double avg = reviewRepository.findAvgRatingByProductId(productId);
        List<Object[]> distRows = reviewRepository.findRatingDistributionByProductId(productId);

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        for (Object[] row : distRows) {
            distribution.put((Integer) row[0], (Long) row[1]);
        }

        return ReviewStatsDto.builder()
                .productId(productId)
                .reviewCount(count)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .distribution(distribution)
                .build();
    }

    /** Chatbot: en çok yorum alan ürünler */
    public List<Map<String, Object>> getMostReviewedProducts(int limit) {
        return reviewRepository.findMostReviewedProducts().stream()
                .limit(limit)
                .map(row -> Map.of("productId", row[0], "reviewCount", row[1]))
                .collect(Collectors.toList());
    }

    /** Chatbot: en kötü puanlı ürünler */
    public List<Map<String, Object>> getWorstRatedProducts(int limit, int minReviews) {
        return reviewRepository.findWorstRatedProducts(minReviews).stream()
                .limit(limit)
                .map(row -> Map.of("productId", row[0], "averageRating", row[1]))
                .collect(Collectors.toList());
    }

    /** Chatbot: en iyi puanlı ürünler */
    public List<Map<String, Object>> getBestRatedProducts(int limit, int minReviews) {
        return reviewRepository.findBestRatedProducts(minReviews).stream()
                .limit(limit)
                .map(row -> Map.of("productId", row[0], "averageRating", row[1]))
                .collect(Collectors.toList());
    }
}
