package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.model.Store;
import com.aplicationproject.demo.service.StoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {
    @Autowired
    private StoreService storeService;

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Store> getStoreById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Store>> getStoresByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(storeService.getStoresByOwnerId(ownerId));
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@Valid @RequestBody Store store) {
        return ResponseEntity.ok(storeService.createStore(store));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Store> updateStore(@PathVariable Long id, @Valid @RequestBody Store store) {
        return ResponseEntity.ok(storeService.updateStore(id, store));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}