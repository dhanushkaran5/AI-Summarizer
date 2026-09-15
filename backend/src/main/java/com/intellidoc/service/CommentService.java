package com.intellidoc.service;

import com.intellidoc.dto.CommentDto;
import com.intellidoc.entity.Comment;
import com.intellidoc.entity.CommentReply;
import com.intellidoc.entity.User;
import com.intellidoc.repository.CommentReplyRepository;
import com.intellidoc.repository.CommentRepository;
import com.intellidoc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentReplyRepository commentReplyRepository;

    @Autowired
    private UserRepository userRepository;

    public CommentDto.CommentResponse addComment(Long summaryId, Long userId, CommentDto.CreateCommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = Comment.builder()
                .summaryId(summaryId)
                .userId(userId)
                .userName(user.getName())
                .segmentId(request.getSegmentId())
                .text(request.getText())
                .resolved(false)
                .build();

        Comment saved = commentRepository.save(comment);
        return mapToCommentResponse(saved, List.of());
    }

    public CommentDto.ReplyResponse addReply(Long commentId, Long userId, CommentDto.CreateReplyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        CommentReply reply = CommentReply.builder()
                .commentId(comment.getId())
                .userId(userId)
                .userName(user.getName())
                .text(request.getText())
                .build();

        CommentReply saved = commentReplyRepository.save(reply);
        return CommentDto.ReplyResponse.builder()
                .id(saved.getId())
                .commentId(saved.getCommentId())
                .userId(saved.getUserId())
                .userName(saved.getUserName())
                .text(saved.getText())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<CommentDto.CommentResponse> getSummaryComments(Long summaryId) {
        List<Comment> comments = commentRepository.findBySummaryIdOrderByCreatedAtAsc(summaryId);
        return comments.stream().map(c -> {
            List<CommentReply> replies = commentReplyRepository.findByCommentIdOrderByCreatedAtAsc(c.getId());
            List<CommentDto.ReplyResponse> replyDtos = replies.stream().map(r -> CommentDto.ReplyResponse.builder()
                    .id(r.getId())
                    .commentId(r.getCommentId())
                    .userId(r.getUserId())
                    .userName(r.getUserName())
                    .text(r.getText())
                    .createdAt(r.getCreatedAt())
                    .build()).collect(Collectors.toList());
            return mapToCommentResponse(c, replyDtos);
        }).collect(Collectors.toList());
    }

    public CommentDto.CommentResponse toggleResolve(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        comment.setResolved(!Boolean.TRUE.equals(comment.getResolved()));
        comment.setUpdatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);

        List<CommentReply> replies = commentReplyRepository.findByCommentIdOrderByCreatedAtAsc(saved.getId());
        List<CommentDto.ReplyResponse> replyDtos = replies.stream().map(r -> CommentDto.ReplyResponse.builder()
                .id(r.getId())
                .commentId(r.getCommentId())
                .userId(r.getUserId())
                .userName(r.getUserName())
                .text(r.getText())
                .createdAt(r.getCreatedAt())
                .build()).collect(Collectors.toList());

        return mapToCommentResponse(saved, replyDtos);
    }

    private CommentDto.CommentResponse mapToCommentResponse(Comment c, List<CommentDto.ReplyResponse> replies) {
        return CommentDto.CommentResponse.builder()
                .id(c.getId())
                .summaryId(c.getSummaryId())
                .userId(c.getUserId())
                .userName(c.getUserName())
                .segmentId(c.getSegmentId())
                .text(c.getText())
                .resolved(c.getResolved())
                .replies(replies)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
