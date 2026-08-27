package com.intellidoc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceDto {
    private String defaultSummaryMode;
    private Integer defaultDepthLevel;
    private Boolean highContrastMode;
    private Integer textScalePercent;
    private Boolean reducedMotion;
    private String preferredAiProvider;
}
