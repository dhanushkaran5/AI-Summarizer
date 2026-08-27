package com.intellidoc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    private String defaultSummaryMode; // executive, student, research, technical, beginner, meeting, exam, legal_policy

    private Integer defaultDepthLevel; // 0-5

    private Boolean highContrastMode;

    private Integer textScalePercent; // 100-200

    private Boolean reducedMotion;

    private String preferredAiProvider; // mock, openai, gemini
}
