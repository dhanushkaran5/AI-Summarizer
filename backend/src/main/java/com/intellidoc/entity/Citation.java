package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "citations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Citation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long messageId;

    @Column(nullable = false)
    private Long documentId;

    private Integer pageNumber;

    private String section;

    private String chunkId;

    @Column(columnDefinition = "TEXT")
    private String textPreview;

    private Double relevanceScore;

    private Integer charStart;

    private Integer charEnd;
}
