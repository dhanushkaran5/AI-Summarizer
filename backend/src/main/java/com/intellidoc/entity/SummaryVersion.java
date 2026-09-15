package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "summary_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummaryVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long summaryId;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(columnDefinition = "TEXT")
    private String summaryText;

    @Column(columnDefinition = "TEXT")
    private String sectionsJson;

    private String persona;
    private String length;
    private String mode;
    private Double confidenceScore;
    private Double compressionRatio;

    private String changeNote;
    private Integer restoredFromVersion;

    private Long createdBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
