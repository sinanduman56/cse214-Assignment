package com.aplicationproject.demo.service;

import com.aplicationproject.demo.model.Shipment;
import com.aplicationproject.demo.repository.ShipmentRepository;
import com.aplicationproject.demo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ShipmentService {

    @Autowired
    private ShipmentRepository shipmentRepository;

    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kargo kaydi bulunamadi: " + id));
    }

    public Shipment createShipment(Shipment shipment) {
        return shipmentRepository.save(shipment);
    }

    public Shipment updateShipment(Long id, Shipment shipmentDetails) {
        Shipment shipment = getShipmentById(id);
        shipment.setWarehouse(shipmentDetails.getWarehouse());
        shipment.setShipmentMode(shipmentDetails.getShipmentMode());
        shipment.setCustomerCareCalls(shipmentDetails.getCustomerCareCalls());
        shipment.setCustomerRating(shipmentDetails.getCustomerRating());
        shipment.setCostOfProduct(shipmentDetails.getCostOfProduct());
        shipment.setPriorPurchases(shipmentDetails.getPriorPurchases());
        shipment.setProductImportance(shipmentDetails.getProductImportance());
        shipment.setDiscountOffered(shipmentDetails.getDiscountOffered());
        return shipmentRepository.save(shipment);
    }

    public void deleteShipment(Long id) {
        Shipment shipment = getShipmentById(id);
        shipmentRepository.delete(shipment);
    }
}