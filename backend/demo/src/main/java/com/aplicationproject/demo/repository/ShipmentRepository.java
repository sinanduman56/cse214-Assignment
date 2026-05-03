package com.aplicationproject.demo.repository;

import com.aplicationproject.demo.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByWarehouse(String warehouse);
    Optional<Shipment> findByOrderId(Long orderId);
}