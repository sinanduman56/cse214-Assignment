package com.aplicationproject.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequest {
    private String question;
    private String userRole;
    private Long userId;
    private Long storeId;
}
