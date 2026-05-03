package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.model.CustomerProfile;
import com.aplicationproject.demo.service.CustomerProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
public class CustomerProfileController {

    @Autowired
    private CustomerProfileService profileService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<CustomerProfile> getProfileByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfileByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<CustomerProfile> createProfile(@Valid @RequestBody CustomerProfile profile) {
        return ResponseEntity.ok(profileService.createProfile(profile));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<CustomerProfile> updateProfile(@PathVariable Long userId, @Valid @RequestBody CustomerProfile profile) {
        return ResponseEntity.ok(profileService.updateProfile(userId, profile));
    }
}