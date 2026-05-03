package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUserId(Long userId);

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    @Query("SELECT r FROM Review r WHERE r.product.store.id = :storeId ORDER BY r.createdAt DESC")
    List<Review> findByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT AVG(r.starRating) FROM Review r WHERE r.product.id = :productId")
    Double findAvgRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT r.starRating, COUNT(r) FROM Review r WHERE r.product.id = :productId GROUP BY r.starRating")
    List<Object[]> findRatingDistributionByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);

    /** For chatbot: top N most reviewed products */
    @Query("SELECT r.product.id, COUNT(r) as cnt FROM Review r GROUP BY r.product.id ORDER BY cnt DESC")
    List<Object[]> findMostReviewedProducts();

    /** For chatbot: worst average rated products (min reviews threshold) */
    @Query("SELECT r.product.id, AVG(r.starRating) as avg FROM Review r GROUP BY r.product.id HAVING COUNT(r) >= :minReviews ORDER BY avg ASC")
    List<Object[]> findWorstRatedProducts(@Param("minReviews") int minReviews);

    /** For chatbot: best average rated products */
    @Query("SELECT r.product.id, AVG(r.starRating) as avg FROM Review r GROUP BY r.product.id HAVING COUNT(r) >= :minReviews ORDER BY avg DESC")
    List<Object[]> findBestRatedProducts(@Param("minReviews") int minReviews);
}
