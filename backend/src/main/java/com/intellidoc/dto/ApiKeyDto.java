package com.intellidoc.dto;

import lombok.*;
import java.time.LocalDateTime;

public class ApiKeyDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateKeyRequest {
        private String name;
        private Integer rateLimitPerMinute;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateKeyResponse {
        private Long id;
        private String name;
        private String rawKey; // Shown ONLY ONCE upon creation!
        private String keyPrefix;
        private Integer rateLimitPerMinute;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KeyResponse {
        private Long id;
        private String name;
        private String keyPrefix;
        private Integer rateLimitPerMinute;
        private Boolean active;
        private LocalDateTime lastUsedAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UsageLogResponse {
        private Long id;
        private Long apiKeyId;
        private String endpoint;
        private String httpMethod;
        private Integer responseStatus;
        private Long responseTimeMs;
        private LocalDateTime timestamp;
    }
}
