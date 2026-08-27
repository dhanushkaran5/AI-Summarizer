package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class ChatDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequest {
        private String question;
        private Long conversationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceDto {
        private Integer pageNumber;
        private String section;
        private String chunkId;
        private String textPreview;
        private Double relevanceScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerificationResultDto {
        private String status;
        private Double confidence;
        private Integer evidenceCount;
        private String details;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private String answer;
        private List<SourceDto> sources;
        private VerificationResultDto verification;
        private Boolean mock;
        private Long messageId;
        private Long conversationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationDto {
        private Long id;
        private Long userId;
        private Long documentId;
        private Long collectionId;
        private String title;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDto {
        private Long id;
        private Long conversationId;
        private String role;
        private String content;
        private List<SourceDto> sources;
        private VerificationResultDto verification;
        private Boolean mock;
        private String createdAt;
    }
}
