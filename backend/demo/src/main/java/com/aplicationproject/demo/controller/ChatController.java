package com.aplicationproject.demo.controller;

import com.aplicationproject.demo.dto.ChatResponse;
import com.aplicationproject.demo.model.User;
import com.aplicationproject.demo.repository.UserRepository;
import com.aplicationproject.demo.service.QueryExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final QueryExecutionService queryExecutionService;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_AI_URL = "http://localhost:8000/ask";

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> ask(@RequestBody Map<String, Object> request) {
        ChatResponse response = new ChatResponse();
        try {
            String message = (String) request.get("message");
            if (message == null || message.isBlank()) {
                response.setSuccess(false);
                response.setError("Mesaj boş olamaz.");
                return ResponseEntity.badRequest().body(response);
            }

            Map<String, Object> pythonRequest = new java.util.HashMap<>();
            pythonRequest.put("message", message);

            // Güvenlik: userId ve userRole asla istemciden alınmaz.
            // Gerçek kimlik, doğrulanmış JWT token'dan Spring Security context üzerinden çekilir.
            Integer resolvedUserId = null;
            String resolvedUserRole = "CUSTOMER";

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                Optional<User> userOpt = userRepository.findByEmail(auth.getName());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    resolvedUserId = user.getId().intValue();
                    resolvedUserRole = user.getRoleType().toUpperCase();
                }
            }

            if (resolvedUserId != null) {
                pythonRequest.put("userId", resolvedUserId);
            }
            pythonRequest.put("userRole", resolvedUserRole);
            @SuppressWarnings("unchecked")
            Map<String, Object> pythonResponse = restTemplate.postForObject(PYTHON_AI_URL, pythonRequest, Map.class);
            if (pythonResponse != null && Boolean.TRUE.equals(pythonResponse.get("success"))) {
                response.setSuccess(true);
                response.setAnswer((String) pythonResponse.get("answer"));
                response.setChartData(pythonResponse.get("chart_data"));
                response.setGuardrailInfo(pythonResponse.get("guardrail_info"));
            } else {
                response.setSuccess(false);
                response.setError(pythonResponse != null ? (String) pythonResponse.get("error") : "AI servisi yanıt vermedi.");
                response.setAnswer("Üzgünüm, şu an yanıt üretemiyorum. Lütfen tekrar deneyin.");
            }
        } catch (Exception e) {
            response.setSuccess(false);
            response.setAnswer("AI servisine bağlanılamıyor. Lütfen daha sonra tekrar deneyin.");
            response.setError(e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint for executing AI-generated SQL queries safely.
     * Called by the Python LangGraph agent after SQL generation.
     */
    @PostMapping("/execute-query")
    public ResponseEntity<ChatResponse> executeQuery(@RequestBody Map<String, String> request) {
        ChatResponse response = new ChatResponse();

        try {
            String sql = request.get("sql");
            if (sql == null || sql.isBlank()) {
                response.setSuccess(false);
                response.setError("SQL sorgusu boş olamaz.");
                return ResponseEntity.badRequest().body(response);
            }

            List<Map<String, Object>> results = queryExecutionService.executeQuery(sql);
            response.setSqlQuery(sql);
            response.setData(results);
            response.setSuccess(true);
            response.setAnswer("Sorgu başarıyla çalıştırıldı. " + results.size() + " kayıt bulundu.");
        } catch (SecurityException e) {
            response.setSuccess(false);
            response.setError(e.getMessage());
            return ResponseEntity.status(403).body(response);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setError(e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }

        return ResponseEntity.ok(response);
    }
}
