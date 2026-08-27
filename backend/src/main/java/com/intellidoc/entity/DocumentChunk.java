package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_chunks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentChunk {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    private Integer chunkIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    private Integer pageNumber;
    private String section;

    @Column(length = 2000)
    private String metadata;
}
