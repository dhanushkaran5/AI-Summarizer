package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentIntelligenceResponse {
    private Integer pageCount;
    private Integer wordCount;
    private Integer charCount;
    private Double readingTimeMinutes;
    private Integer sectionCount;
    private Integer chunkCount;
    private List<String> keywords;
    private List<String> keyConcepts;
}
