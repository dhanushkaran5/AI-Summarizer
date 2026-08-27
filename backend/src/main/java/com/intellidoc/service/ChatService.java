package com.intellidoc.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.ChatDto;
import com.intellidoc.entity.Conversation;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.Message;
import com.intellidoc.repository.ConversationRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ChatDto.ChatResponse sendMessage(Long docId, Long userId, ChatDto.ChatRequest request) {
        Document doc = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + docId));

        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found: " + request.getConversationId()));
        } else {
            conversation = conversationRepository.findFirstByDocumentIdAndUserIdOrderByCreatedAtDesc(docId, userId)
                    .orElseGet(() -> {
                        String title = request.getQuestion().length() > 40
                                ? request.getQuestion().substring(0, 37) + "..."
                                : request.getQuestion();
                        return conversationRepository.save(Conversation.builder()
                                .userId(userId)
                                .documentId(docId)
                                .title(title)
                                .createdAt(LocalDateTime.now())
                                .build());
                    });
        }

        // Save User Message
        Message userMsg = Message.builder()
                .conversationId(conversation.getId())
                .role("user")
                .content(request.getQuestion())
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(userMsg);

        // Fetch conversation history
        List<Message> historyMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Map<String, String>> historyList = new ArrayList<>();
        for (Message m : historyMessages) {
            Map<String, String> item = new HashMap<>();
            item.put("role", m.getRole());
            item.put("content", m.getContent());
            historyList.add(item);
        }

        // Call AI Service
        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", docId.toString());
        aiRequest.put("question", request.getQuestion());
        aiRequest.put("conversation_history", historyList);

        Map<String, Object> aiResult = aiServiceClient.chatWithDocument(aiRequest);

        String answer = (String) aiResult.getOrDefault("answer", "");
        List<Map<String, Object>> sourcesList = (List<Map<String, Object>>) aiResult.getOrDefault("sources", Collections.emptyList());
        Map<String, Object> verificationMap = (Map<String, Object>) aiResult.getOrDefault("verification", Collections.emptyMap());
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);

        String sourcesJson;
        String verificationJson;
        try {
            sourcesJson = objectMapper.writeValueAsString(sourcesList);
            verificationJson = objectMapper.writeValueAsString(verificationMap);
        } catch (JsonProcessingException e) {
            sourcesJson = "[]";
            verificationJson = "{}";
        }

        // Save Assistant Message
        Message assistantMsg = Message.builder()
                .conversationId(conversation.getId())
                .role("assistant")
                .content(answer)
                .sources(sourcesJson)
                .verification(verificationJson)
                .mock(isMock)
                .createdAt(LocalDateTime.now())
                .build();

        assistantMsg = messageRepository.save(assistantMsg);

        // Format Sources & Verification DTOs
        List<ChatDto.SourceDto> sourceDtos = new ArrayList<>();
        for (Map<String, Object> s : sourcesList) {
            sourceDtos.add(ChatDto.SourceDto.builder()
                    .pageNumber((Integer) s.get("page_number"))
                    .section((String) s.get("section"))
                    .chunkId(s.get("chunk_id") != null ? s.get("chunk_id").toString() : "")
                    .textPreview((String) s.get("text_preview"))
                    .relevanceScore(s.get("relevance_score") instanceof Number ? ((Number) s.get("relevance_score")).doubleValue() : 0.0)
                    .build());
        }

        ChatDto.VerificationResultDto verificationDto = ChatDto.VerificationResultDto.builder()
                .status((String) verificationMap.getOrDefault("status", "supported"))
                .confidence(verificationMap.get("confidence") instanceof Number ? ((Number) verificationMap.get("confidence")).doubleValue() : 0.9)
                .evidenceCount((Integer) verificationMap.getOrDefault("evidence_count", 1))
                .details((String) verificationMap.getOrDefault("details", ""))
                .build();

        return ChatDto.ChatResponse.builder()
                .answer(answer)
                .sources(sourceDtos)
                .verification(verificationDto)
                .mock(isMock)
                .messageId(assistantMsg.getId())
                .conversationId(conversation.getId())
                .build();
    }

    public List<ChatDto.ConversationDto> getConversations(Long docId, Long userId) {
        List<Conversation> list = conversationRepository.findByDocumentIdAndUserIdOrderByCreatedAtDesc(docId, userId);
        List<ChatDto.ConversationDto> result = new ArrayList<>();
        for (Conversation c : list) {
            result.add(ChatDto.ConversationDto.builder()
                    .id(c.getId())
                    .userId(c.getUserId())
                    .documentId(c.getDocumentId())
                    .collectionId(c.getCollectionId())
                    .title(c.getTitle())
                    .createdAt(c.getCreatedAt().toString())
                    .build());
        }
        return result;
    }

    public List<ChatDto.MessageDto> getMessages(Long conversationId, Long userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        if (!conv.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to conversation " + conversationId);
        }

        List<Message> list = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<ChatDto.MessageDto> result = new ArrayList<>();

        for (Message m : list) {
            List<ChatDto.SourceDto> sourceDtos = Collections.emptyList();
            if (m.getSources() != null) {
                try {
                    List<Map<String, Object>> rawSources = objectMapper.readValue(m.getSources(), List.class);
                    sourceDtos = new ArrayList<>();
                    for (Map<String, Object> s : rawSources) {
                        sourceDtos.add(ChatDto.SourceDto.builder()
                                .pageNumber((Integer) s.get("page_number"))
                                .section((String) s.get("section"))
                                .chunkId(s.get("chunk_id") != null ? s.get("chunk_id").toString() : "")
                                .textPreview((String) s.get("text_preview"))
                                .relevanceScore(s.get("relevance_score") instanceof Number ? ((Number) s.get("relevance_score")).doubleValue() : 0.0)
                                .build());
                    }
                } catch (Exception ignored) {}
            }

            ChatDto.VerificationResultDto verificationDto = null;
            if (m.getVerification() != null) {
                try {
                    Map<String, Object> vMap = objectMapper.readValue(m.getVerification(), Map.class);
                    verificationDto = ChatDto.VerificationResultDto.builder()
                            .status((String) vMap.getOrDefault("status", "supported"))
                            .confidence(vMap.get("confidence") instanceof Number ? ((Number) vMap.get("confidence")).doubleValue() : 0.9)
                            .evidenceCount((Integer) vMap.getOrDefault("evidence_count", 1))
                            .details((String) vMap.getOrDefault("details", ""))
                            .build();
                } catch (Exception ignored) {}
            }

            result.add(ChatDto.MessageDto.builder()
                    .id(m.getId())
                    .conversationId(m.getConversationId())
                    .role(m.getRole())
                    .content(m.getContent())
                    .sources(sourceDtos)
                    .verification(verificationDto)
                    .mock(m.getMock())
                    .createdAt(m.getCreatedAt().toString())
                    .build());
        }

        return result;
    }
}
