package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String fileType;

    private Long fileSize;

    @Column(nullable = false)
    @Builder.Default
    private String status = "UPLOADING";

    @Builder.Default private Integer pageCount = 0;
    @Builder.Default private Integer wordCount = 0;
    @Builder.Default private Integer charCount = 0;
    @Builder.Default private Double readingTimeMinutes = 0.0;

    @Column(length = 5000)
    private String keywords;

    @Column(length = 5000)
    private String keyConcepts;

    private String documentType;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    private LocalDateTime processedAt;
}
