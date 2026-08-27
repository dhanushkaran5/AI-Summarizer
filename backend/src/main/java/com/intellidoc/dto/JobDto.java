package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDto {
    private String jobId;
    private Long documentId;
    private String status;
    private Integer progressPercent;
    private String currentStageDescription;
    private String errorMessage;
    private String diagnosticRemedy;
    private String createdAt;
    private String completedAt;
}
