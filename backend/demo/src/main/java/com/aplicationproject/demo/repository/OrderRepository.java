package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi JOIN oi.product p WHERE p.store.id = :storeId ORDER BY o.orderDate DESC")
    List<Order> findByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(o), COALESCE(SUM(o.grandTotal), 0) FROM Order o " +
           "JOIN o.orderItems oi JOIN oi.product p WHERE p.store.id = :storeId")
    List<Object[]> getStoreOrderStats(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(o), COALESCE(SUM(o.grandTotal), 0) FROM Order o WHERE o.user.id = :userId")
    List<Object[]> getUserOrderStats(@Param("userId") Long userId);

    // Tarih aralığına göre ürün bazlı gelir kırılımı
    @Query(value = """
        SELECT p.name, SUM(oi.unit_price * oi.quantity) AS revenue, SUM(oi.quantity) AS qty
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE p.store_id = :storeId
          AND (:from IS NULL OR CAST(o.order_date AS date) >= :from)
          AND (:to   IS NULL OR CAST(o.order_date AS date) <= :to)
        GROUP BY p.name
        ORDER BY revenue DESC
        LIMIT 15
        """, nativeQuery = true)
    List<Object[]> getRevenueByProduct(
        @Param("storeId") Long storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    // Tarih aralığına göre günlük gelir
    @Query(value = """
        SELECT CAST(o.order_date AS date) AS day, SUM(oi.unit_price * oi.quantity) AS revenue
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE p.store_id = :storeId
          AND (:from IS NULL OR CAST(o.order_date AS date) >= :from)
          AND (:to   IS NULL OR CAST(o.order_date AS date) <= :to)
        GROUP BY CAST(o.order_date AS date)
        ORDER BY day ASC
        """, nativeQuery = true)
    List<Object[]> getDailyRevenue(
        @Param("storeId") Long storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}