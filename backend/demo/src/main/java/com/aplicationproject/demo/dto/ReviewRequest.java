package com.aplicationproject.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "Kullanıcı ID boş olamaz")
    private Long userId;

    @NotNull(message = "Ürün ID boş olamaz")
    private Long productId;

    @NotNull(message = "Puan boş olamaz")
    @Min(value = 1, message = "Puan en az 1 olmalıdır")
    @Max(value = 5, message = "Puan en fazla 5 olmalıdır")
    private Integer starRating;

    private String content;
}
