package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "summaries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Summary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long documentId;

    private Long workspaceId;

    private String title;

    private String documentType;

    @Builder.Default
    private String mode = "HYBRID"; // HYBRID, EXTRACTIVE, ABSTRACTIVE

    @Builder.Default
    private String length = "STANDARD"; // BRIEF, STANDARD, DETAILED

    @Builder.Default
    private String persona = "Executive"; // Executive, Academic, Technical, Casual

    @Builder.Default
    private String level = "standard";

    private String detectedLanguage;
    private String targetLanguage;

    @Column(columnDefinition = "TEXT")
    private String summaryText;

    @Column(columnDefinition = "TEXT")
    private String content; // JSON string of sections

    @Column(columnDefinition = "TEXT")
    private String sectionsJson;

    @Column(columnDefinition = "TEXT")
    private String qualityMetricsJson;

    @Column(columnDefinition = "TEXT")
    private String sentimentJson;

    @Column(columnDefinition = "TEXT")
    private String insightsJson;

    @Column(columnDefinition = "TEXT")
    private String traceabilityJson;

    private Double confidenceScore;
    private Double compressionRatio;
    private Long processingTimeMs;

    @Builder.Default
    private Integer currentVersion = 1;

    @Builder.Default
    private Boolean mock = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
