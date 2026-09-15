package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "summary_comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long summaryId;

    @Column(nullable = false)
    private Long userId;

    private String userName;

    private String segmentId; // optional citation of specific summary segment

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Builder.Default
    private Boolean resolved = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
