package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String keyPrefix; // e.g. "sum_ai_live_83fa..." for identification

    @Column(nullable = false, unique = true)
    private String keyHash; // SHA-256 hash of the complete raw secret key

    @Builder.Default
    private Integer rateLimitPerMinute = 60;

    @Builder.Default
    private Boolean active = true;

    private LocalDateTime lastUsedAt;
    private LocalDateTime expiresAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
