package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ContradictionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String statementA;
        private String sectionA;
        private Integer pageA;
        private String statementB;
        private String sectionB;
        private Integer pageB;
        private String explanation;
        private String severity; // high, medium, low
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long documentId;
        private List<Item> contradictions;
        private Integer count;
        private Boolean mock;
    }
}
