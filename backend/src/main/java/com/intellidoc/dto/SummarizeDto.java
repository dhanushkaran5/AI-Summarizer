package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class SummarizeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummarizeRequest {
        private String length; // brief, standard, detailed
        private String level;  // beginner, student, professional, expert
        private String documentType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryResponse {
        private Long id;
        private Long documentId;
        private String documentType;
        private String length;
        private String level;
        private Map<String, Object> content;
        private String generatedAt;
        private Boolean mock;
    }
}
