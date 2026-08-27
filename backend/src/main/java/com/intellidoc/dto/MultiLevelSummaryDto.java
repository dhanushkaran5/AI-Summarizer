package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class MultiLevelSummaryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String mode; // executive, student, research, technical, beginner, meeting, exam, legal_policy, custom
        private Integer targetLevel; // 0-5
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long documentId;
        private String mode;
        private String level0; // Essence
        private String level1; // Executive
        private Map<String, String> level2; // Detailed sections
        private List<Map<String, Object>> level3; // Section-by-section
        private String level4; // Deep technical
        private List<Map<String, String>> level5; // Q&A Knowledge base
        private Boolean mock;
    }
}
