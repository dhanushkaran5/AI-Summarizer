package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "summaries")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Summary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    private String documentType;
    private String length;
    private String level;

    @Column(columnDefinition = "TEXT")
    private String content;  // JSON string of section -> text

    @Builder.Default
    private Boolean mock = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();
}
