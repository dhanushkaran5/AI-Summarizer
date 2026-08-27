package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long conversationId;

    @Column(nullable = false) private String role; // "user" or "assistant"

    @Column(columnDefinition = "TEXT", nullable = false) private String content;

    @Column(columnDefinition = "TEXT") private String sources; // JSON

    @Column(columnDefinition = "TEXT") private String verification; // JSON

    @Builder.Default private Boolean mock = false;

    @Column(nullable = false, updatable = false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
