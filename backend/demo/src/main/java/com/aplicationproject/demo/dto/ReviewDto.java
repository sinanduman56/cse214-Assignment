package com.aplicationproject.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private Integer starRating;
    private String content;
    private Integer helpfulVotes;
    private Integer totalVotes;
    private Long userId;
    private String userEmail;
    private Long productId;
    private String productName;
    private LocalDateTime createdAt;
}
