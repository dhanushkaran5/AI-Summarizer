package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class StudyMaterialDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudyMaterialRequest {
        private String difficulty; // easy, medium, hard
        private List<String> types; // mcq, short_answer, flashcard
        private Integer count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudyMaterialResponse {
        private List<Map<String, Object>> questions;
        private Boolean mock;
        private String difficulty;
    }
}
