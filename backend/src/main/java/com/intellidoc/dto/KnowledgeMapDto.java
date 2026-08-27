package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeMapDto {
    private Long documentId;
    private String title;
    private Map<String, Object> root;
    private Boolean mock;
}
