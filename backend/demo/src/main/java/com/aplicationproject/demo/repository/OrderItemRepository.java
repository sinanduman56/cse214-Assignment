package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    /** Kullanıcının bu ürünü satın alıp almadığını kontrol et (delivered veya shipped siparişlerde) */
    @Query("""
        SELECT COUNT(oi) > 0 FROM OrderItem oi
        WHERE oi.order.user.id = :userId
          AND oi.product.id   = :productId
          AND oi.order.status IN ('delivered', 'shipped')
        """)
    boolean existsByUserAndProduct(@Param("userId") Long userId,
                                   @Param("productId") Long productId);
}
