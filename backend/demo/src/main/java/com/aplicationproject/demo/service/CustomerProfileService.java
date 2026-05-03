package com.aplicationproject.demo.service;

import com.aplicationproject.demo.model.CustomerProfile;
import com.aplicationproject.demo.repository.CustomerProfileRepository;
import com.aplicationproject.demo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CustomerProfileService {
    @Autowired
    private CustomerProfileRepository profileRepository;

    public CustomerProfile getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı, user id: " + userId));
    }

    public CustomerProfile createProfile(CustomerProfile profile) {
        return profileRepository.save(profile);
    }

    public CustomerProfile updateProfile(Long userId, CustomerProfile profileDetails) {
        CustomerProfile profile = getProfileByUserId(userId);
        profile.setAge(profileDetails.getAge());
        profile.setCity(profileDetails.getCity());
        profile.setMembershipType(profileDetails.getMembershipType());
        profile.setTotalSpend(profileDetails.getTotalSpend());
        return profileRepository.save(profile);
    }
}