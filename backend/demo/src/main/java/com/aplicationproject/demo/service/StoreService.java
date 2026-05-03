package com.aplicationproject.demo.service;

import com.aplicationproject.demo.dto.StoreSummaryDto;
import com.aplicationproject.demo.model.Store;
import com.aplicationproject.demo.repository.StoreRepository;
import com.aplicationproject.demo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoreService {
    @Autowired
    private StoreRepository storeRepository;

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public List<StoreSummaryDto> getAllStoreSummaries() {
        return storeRepository.findAll().stream()
                .map(s -> new StoreSummaryDto(
                        s.getId(), s.getName(), s.getLocation(), s.isActive(),
                        s.getOwner().getId(), s.getOwner().getEmail()))
                .collect(Collectors.toList());
    }

    public Store getStoreById(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mağaza bulunamadı: " + id));
    }

    public List<Store> getStoresByOwnerId(Long ownerId) {
        return storeRepository.findByOwnerId(ownerId);
    }

    public Store createStore(Store store) {
        return storeRepository.save(store);
    }

    public Store updateStore(Long id, Store storeDetails) {
        Store store = getStoreById(id);
        store.setName(storeDetails.getName());
        store.setLocation(storeDetails.getLocation());
        return storeRepository.save(store);
    }

    public void deleteStore(Long id) {
        Store store = getStoreById(id);
        storeRepository.delete(store);
    }

    public Store setStoreActive(Long id, boolean active) {
        Store store = getStoreById(id);
        store.setActive(active);
        return storeRepository.save(store);
    }
}