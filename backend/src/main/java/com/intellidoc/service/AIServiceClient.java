package com.intellidoc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIServiceClient {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> extractDocument(MultipartFile file) throws IOException {
        return extractDocumentFromBytes(file.getBytes(), file.getOriginalFilename());
    }

    public Map<String, Object> extractDocumentFromBytes(byte[] fileBytes, String originalFilename) throws IOException {
        String url = aiServiceUrl + "/api/extract";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        final String fname = (originalFilename != null && !originalFilename.isBlank()) ? originalFilename : "document.txt";
        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return fname;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            // Log diagnostic info and bubble error or structured fallback
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("document_id", "fallback-" + System.currentTimeMillis());
            fallback.put("filename", fname);
            fallback.put("file_type", fname.contains(".") ? fname.substring(fname.lastIndexOf(".") + 1) : "txt");
            fallback.put("page_count", 1);
            fallback.put("word_count", 0);
            fallback.put("char_count", 0);
            fallback.put("reading_time_minutes", 0.0);
            fallback.put("chunks", Collections.emptyList());
            fallback.put("keywords", Collections.emptyList());
            fallback.put("status", "extracted_fallback");
            fallback.put("error", e.getMessage());
            return fallback;
        }
    }

    public Map<String, Object> summarizeDocument(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/summarize";
        return postJson(url, requestData);
    }

    public Map<String, Object> summarizeV2(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/summarize/v2";
        return postJson(url, requestData);
    }

    public Map<String, Object> getMultiLevelSummary(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/summarize/multi-level";
        return postJson(url, requestData);
    }

    public Map<String, Object> getContradictions(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/contradictions";
        return postJson(url, requestData);
    }

    public Map<String, Object> getKnowledgeMap(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/knowledge-map";
        return postJson(url, requestData);
    }

    public Map<String, Object> chatWithDocument(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/chat";
        return postJson(url, requestData);
    }

    public Map<String, Object> verifyClaims(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/verify";
        return postJson(url, requestData);
    }

    public Map<String, Object> generateStudyMaterial(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/study-material";
        return postJson(url, requestData);
    }

    public Map<String, Object> embedChunks(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/embed";
        return postJson(url, requestData);
    }

    public Map<String, Object> compareDocuments(Map<String, Object> requestData) {
        String url = aiServiceUrl + "/api/compare";
        return postJson(url, requestData);
    }

    public boolean isHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(aiServiceUrl + "/ready", Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> postJson(String url, Map<String, Object> requestData) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestData, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("mock", true);
            fallback.put("status", "fallback_due_to_service_unavailability");
            return fallback;
        }
    }
}
