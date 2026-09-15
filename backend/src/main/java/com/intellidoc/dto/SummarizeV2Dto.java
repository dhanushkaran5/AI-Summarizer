package com.intellidoc.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class SummarizeV2Dto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private String text;
        private Long documentId;
        private Long workspaceId;
        private String title;

        @Builder.Default
        private String mode = "HYBRID"; // HYBRID, EXTRACTIVE, ABSTRACTIVE

        @Builder.Default
        private String length = "STANDARD"; // BRIEF, STANDARD, DETAILED

        @Builder.Default
        private String persona = "Executive"; // Executive, Academic, Technical, Casual

        @Builder.Default
        private String language = "auto";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long userId;
        private Long documentId;
        private Long workspaceId;
        private String title;
        private String summaryText;
        private String mode;
        private String length;
        private String persona;
        private String personaTitle;
        private Integer currentVersion;
        private Double confidenceScore;
        private Double compressionRatio;
        private Long processingTimeMs;

        private Object language;
        private Object sections;
        private Object qualityMetrics;
        private Object sentiment;
        private Object insights;
        private Object traceability;

        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VersionResponse {
        private Long id;
        private Long summaryId;
        private Integer versionNumber;
        private String summaryText;
        private Object sections;
        private String persona;
        private String length;
        private String mode;
        private Double confidenceScore;
        private Double compressionRatio;
        private String changeNote;
        private Integer restoredFromVersion;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RestoreRequest {
        private String changeNote;
    }
}
