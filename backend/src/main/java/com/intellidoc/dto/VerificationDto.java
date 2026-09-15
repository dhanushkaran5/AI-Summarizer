package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class VerificationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyRequest {
        private String text;
        private List<String> claims;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClaimVerification {
        private String claim;
        private String status; // SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED
        private Double confidence;
        private String evidenceQuote;
        private List<ChatDto.SourceDto> sources;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyResponse {
        private Long documentId;
        private String status; // SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED
        private String claimStatus; // EXPLICITLY STATED, INFERRED, UNCERTAIN, NOT FOUND
        private Double confidence;
        private List<ClaimVerification> claims;
        private String overallAssessment;
        private List<ChatDto.SourceDto> sources;
        private Boolean mock;
    }
}
