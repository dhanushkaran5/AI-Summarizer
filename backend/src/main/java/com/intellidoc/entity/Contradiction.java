package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_contradictions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contradiction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String statementA;

    private String sectionA;

    private Integer pageA;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String statementB;

    private String sectionB;

    private Integer pageB;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private String severity; // high, medium, low

    private LocalDateTime detectedAt;
}
