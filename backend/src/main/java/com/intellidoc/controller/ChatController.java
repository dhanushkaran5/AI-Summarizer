package com.intellidoc.controller;

import com.intellidoc.dto.ChatDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @PostMapping("/api/documents/{docId}/chat")
    public ResponseEntity<ChatDto.ChatResponse> sendMessage(@PathVariable Long docId,
                                                             @RequestBody ChatDto.ChatRequest request,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(chatService.sendMessage(docId, userId, request));
    }

    @GetMapping("/api/documents/{docId}/conversations")
    public ResponseEntity<List<ChatDto.ConversationDto>> getConversations(@PathVariable Long docId,
                                                                           @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(chatService.getConversations(docId, userId));
    }

    @GetMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<List<ChatDto.MessageDto>> getMessages(@PathVariable Long conversationId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(chatService.getMessages(conversationId, userId));
    }
}
