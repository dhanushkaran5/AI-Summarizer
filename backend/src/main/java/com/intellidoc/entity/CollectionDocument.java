package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "collection_documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long collectionId;
    @Column(nullable = false) private Long documentId;

    @Column(nullable = false, updatable = false) @Builder.Default
    private LocalDateTime addedAt = LocalDateTime.now();
}
