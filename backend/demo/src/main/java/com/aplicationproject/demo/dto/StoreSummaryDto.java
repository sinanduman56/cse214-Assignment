package com.aplicationproject.demo.dto;

public record StoreSummaryDto(Long id, String name, String location, boolean active, Long ownerId, String ownerEmail) {}
