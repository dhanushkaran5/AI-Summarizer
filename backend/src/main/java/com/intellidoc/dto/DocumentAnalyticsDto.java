package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAnalyticsDto {
    private Long documentId;
    private String filename;
    private String fileType;
    private Integer pageCount;
    private Long wordCount;
    private Long characterCount;
    private Integer estimatedReadingTimeMinutes;
    private Integer sectionCount;
    private Integer chunkCount;
}
