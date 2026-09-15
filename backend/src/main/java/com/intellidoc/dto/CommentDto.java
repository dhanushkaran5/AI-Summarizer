package com.intellidoc.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class CommentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCommentRequest {
        private String text;
        private String segmentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateReplyRequest {
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentResponse {
        private Long id;
        private Long summaryId;
        private Long userId;
        private String userName;
        private String segmentId;
        private String text;
        private Boolean resolved;
        private List<ReplyResponse> replies;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReplyResponse {
        private Long id;
        private Long commentId;
        private Long userId;
        private String userName;
        private String text;
        private LocalDateTime createdAt;
    }
}
