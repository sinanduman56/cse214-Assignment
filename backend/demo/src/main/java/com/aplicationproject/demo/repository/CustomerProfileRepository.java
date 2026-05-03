package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {
    Optional<CustomerProfile> findByUserId(Long userId);

    @Query(value = """
        SELECT cp.city, COUNT(DISTINCT o.user_id) AS cnt
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        JOIN customer_profiles cp ON cp.user_id = o.user_id
        WHERE p.store_id = :storeId AND cp.city IS NOT NULL
        GROUP BY cp.city
        ORDER BY cnt DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> getCustomersByCity(@Param("storeId") Long storeId);

    @Query(value = """
        SELECT cp.membership_type, COUNT(DISTINCT o.user_id) AS cnt
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        JOIN customer_profiles cp ON cp.user_id = o.user_id
        WHERE p.store_id = :storeId AND cp.membership_type IS NOT NULL
        GROUP BY cp.membership_type
        ORDER BY cnt DESC
        """, nativeQuery = true)
    List<Object[]> getCustomersByMembership(@Param("storeId") Long storeId);
}