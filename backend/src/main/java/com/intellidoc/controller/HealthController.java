package com.intellidoc.controller;

import com.intellidoc.service.AIServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private AIServiceClient aiServiceClient;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "IntelliDoc AI Backend");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/ready", "/api/ready"})
    public ResponseEntity<Map<String, Object>> ready() {
        Map<String, Object> response = new HashMap<>();
        boolean dbHealthy = true;
        try {
            if (jdbcTemplate != null) {
                jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            }
        } catch (Exception e) {
            dbHealthy = false;
        }

        boolean aiHealthy = aiServiceClient.isHealthy();

        response.put("status", dbHealthy ? "UP" : "DEGRADED");
        response.put("database", dbHealthy ? "UP" : "DOWN");
        response.put("aiService", aiHealthy ? "UP" : "FALLBACK_READY");
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }
}
