package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);

    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:storeId IS NULL OR p.store.id = :storeId) AND " +
           "(:minPrice IS NULL OR p.unitPrice >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.unitPrice <= :maxPrice)")
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("storeId") Long storeId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    List<Product> findByStoreId(Long storeId);

    List<Product> findByCategoryId(Long categoryId);
}