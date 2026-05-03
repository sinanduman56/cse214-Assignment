package com.aplicationproject.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsDto {
    private Long productId;
    private long reviewCount;
    private double averageRating;
    /** Distribution: key = star (1-5), value = count */
    private Map<Integer, Long> distribution;
}
