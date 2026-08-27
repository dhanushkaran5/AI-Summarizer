package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "processing_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String jobId;

    @Column(nullable = false)
    private Long documentId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String status; // UPLOADING, EXTRACTING, CHUNKING, EMBEDDING, SUMMARIZING, COMPLETED, FAILED

    @Column(nullable = false)
    private Integer progressPercent;

    private String currentStageDescription;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(columnDefinition = "TEXT")
    private String diagnosticRemedy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;
}
