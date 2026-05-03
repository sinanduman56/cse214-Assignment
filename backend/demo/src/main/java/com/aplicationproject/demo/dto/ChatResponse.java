package com.aplicationproject.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String answer;
    private String sqlQuery;
    private List<Map<String, Object>> data;
    @JsonProperty("chart_data")
    private Object chartData;
    @JsonProperty("guardrail_info")
    private Object guardrailInfo;
    private boolean success;
    private String error;
}
