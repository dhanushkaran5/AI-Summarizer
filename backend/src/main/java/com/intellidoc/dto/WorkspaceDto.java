package com.intellidoc.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class WorkspaceDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private Long ownerId;
        private String currentUserRole;
        private Integer memberCount;
        private Integer summaryCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddMemberRequest {
        private String email;
        private String role; // OWNER, EDITOR, VIEWER
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberResponse {
        private Long id;
        private Long userId;
        private String email;
        private String name;
        private String role;
        private LocalDateTime joinedAt;
    }
}
