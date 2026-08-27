package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class CollectionDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCollectionRequest {
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddDocumentRequest {
        private Long documentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CollectionResponse {
        private Long id;
        private Long userId;
        private String name;
        private String description;
        private Long documentCount;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompareRequest {
        private List<Long> documentIds;
        private String question;
        private List<String> aspects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompareResponse {
        private Map<String, Object> comparison;
        private List<Map<String, Object>> sources;
        private Boolean mock;
    }
}
