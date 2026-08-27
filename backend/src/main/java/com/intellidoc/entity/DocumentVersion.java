package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(length = 255)
    private String filename;

    @Column(columnDefinition = "TEXT")
    private String changeSummary;

    @Column(columnDefinition = "TEXT")
    private String diffJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
