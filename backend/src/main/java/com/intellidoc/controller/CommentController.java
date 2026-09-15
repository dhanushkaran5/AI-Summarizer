package com.intellidoc.controller;

import com.intellidoc.dto.CommentDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/summaries")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails != null) {
            User user = authService.getUserByEmail(userDetails.getUsername());
            return user.getId();
        }
        return 1L;
    }

    @PostMapping("/{summaryId}/comments")
    public ResponseEntity<CommentDto.CommentResponse> addComment(
            @PathVariable Long summaryId,
            @RequestBody CommentDto.CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(commentService.addComment(summaryId, userId, request));
    }

    @GetMapping("/{summaryId}/comments")
    public ResponseEntity<List<CommentDto.CommentResponse>> getComments(@PathVariable Long summaryId) {
        return ResponseEntity.ok(commentService.getSummaryComments(summaryId));
    }

    @PostMapping("/comments/{commentId}/replies")
    public ResponseEntity<CommentDto.ReplyResponse> addReply(
            @PathVariable Long commentId,
            @RequestBody CommentDto.CreateReplyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(commentService.addReply(commentId, userId, request));
    }

    @PatchMapping("/comments/{commentId}/resolve")
    public ResponseEntity<CommentDto.CommentResponse> toggleResolve(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(commentService.toggleResolve(commentId, userId));
    }
}
