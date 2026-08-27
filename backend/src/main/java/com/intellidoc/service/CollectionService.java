package com.intellidoc.service;

import com.intellidoc.dto.ChatDto;
import com.intellidoc.dto.CollectionDto;
import com.intellidoc.entity.Collection;
import com.intellidoc.entity.CollectionDocument;
import com.intellidoc.entity.Document;
import com.intellidoc.repository.CollectionDocumentRepository;
import com.intellidoc.repository.CollectionRepository;
import com.intellidoc.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CollectionService {

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private CollectionDocumentRepository collectionDocumentRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    public CollectionDto.CollectionResponse createCollection(CollectionDto.CreateCollectionRequest request, Long userId) {
        Collection collection = Collection.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build();

        collection = collectionRepository.save(collection);

        return CollectionDto.CollectionResponse.builder()
                .id(collection.getId())
                .userId(collection.getUserId())
                .name(collection.getName())
                .description(collection.getDescription())
                .documentCount(0L)
                .createdAt(collection.getCreatedAt().toString())
                .build();
    }

    public List<CollectionDto.CollectionResponse> getAllCollections(Long userId) {
        List<Collection> collections = collectionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<CollectionDto.CollectionResponse> result = new ArrayList<>();

        for (Collection c : collections) {
            long count = collectionDocumentRepository.findByCollectionId(c.getId()).size();
            result.add(CollectionDto.CollectionResponse.builder()
                    .id(c.getId())
                    .userId(c.getUserId())
                    .name(c.getName())
                    .description(c.getDescription())
                    .documentCount(count)
                    .createdAt(c.getCreatedAt().toString())
                    .build());
        }

        return result;
    }

    public CollectionDto.CollectionResponse getCollectionById(Long id, Long userId) {
        Collection c = collectionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + id));

        long count = collectionDocumentRepository.findByCollectionId(c.getId()).size();

        return CollectionDto.CollectionResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .name(c.getName())
                .description(c.getDescription())
                .documentCount(count)
                .createdAt(c.getCreatedAt().toString())
                .build();
    }

    @Transactional
    public void deleteCollection(Long id, Long userId) {
        Collection c = collectionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + id));

        collectionDocumentRepository.deleteByCollectionId(id);
        collectionRepository.delete(c);
    }

    public void addDocumentToCollection(Long collectionId, Long documentId, Long userId) {
        collectionRepository.findByIdAndUserId(collectionId, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + collectionId));

        documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        Optional<CollectionDocument> existing = collectionDocumentRepository.findByCollectionIdAndDocumentId(collectionId, documentId);
        if (existing.isEmpty()) {
            collectionDocumentRepository.save(CollectionDocument.builder()
                    .collectionId(collectionId)
                    .documentId(documentId)
                    .addedAt(LocalDateTime.now())
                    .build());
        }
    }

    @Transactional
    public void removeDocumentFromCollection(Long collectionId, Long documentId, Long userId) {
        collectionRepository.findByIdAndUserId(collectionId, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + collectionId));

        collectionDocumentRepository.deleteByCollectionIdAndDocumentId(collectionId, documentId);
    }

    public List<Document> getCollectionDocuments(Long collectionId, Long userId) {
        collectionRepository.findByIdAndUserId(collectionId, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + collectionId));

        List<CollectionDocument> cdList = collectionDocumentRepository.findByCollectionId(collectionId);
        List<Document> result = new ArrayList<>();

        for (CollectionDocument cd : cdList) {
            documentRepository.findById(cd.getDocumentId()).ifPresent(result::add);
        }

        return result;
    }

    public ChatDto.ChatResponse chatWithCollection(Long collectionId, Long userId, ChatDto.ChatRequest request) {
        collectionRepository.findByIdAndUserId(collectionId, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + collectionId));

        List<CollectionDocument> cdList = collectionDocumentRepository.findByCollectionId(collectionId);
        List<String> docIds = cdList.stream().map(cd -> cd.getDocumentId().toString()).collect(Collectors.toList());

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", docIds.isEmpty() ? "0" : docIds.get(0));
        aiRequest.put("question", request.getQuestion());
        aiRequest.put("collection_ids", docIds);

        Map<String, Object> aiResult = aiServiceClient.chatWithDocument(aiRequest);

        String answer = (String) aiResult.getOrDefault("answer", "");
        List<Map<String, Object>> sourcesList = (List<Map<String, Object>>) aiResult.getOrDefault("sources", Collections.emptyList());
        Map<String, Object> verificationMap = (Map<String, Object>) aiResult.getOrDefault("verification", Collections.emptyMap());
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);

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
                .messageId(0L)
                .conversationId(0L)
                .build();
    }

    public CollectionDto.CompareResponse compareCollectionDocuments(Long collectionId, Long userId, CollectionDto.CompareRequest request) {
        collectionRepository.findByIdAndUserId(collectionId, userId)
                .orElseThrow(() -> new RuntimeException("Collection not found with ID: " + collectionId));

        List<String> docIds;
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            docIds = request.getDocumentIds().stream().map(Object::toString).collect(Collectors.toList());
        } else {
            List<CollectionDocument> cdList = collectionDocumentRepository.findByCollectionId(collectionId);
            docIds = cdList.stream().map(cd -> cd.getDocumentId().toString()).collect(Collectors.toList());
        }

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_ids", docIds);
        if (request.getQuestion() != null) aiRequest.put("question", request.getQuestion());
        if (request.getAspects() != null) aiRequest.put("aspects", request.getAspects());

        Map<String, Object> aiResult = aiServiceClient.compareDocuments(aiRequest);

        Map<String, Object> comparison = (Map<String, Object>) aiResult.getOrDefault("comparison", Collections.emptyMap());
        List<Map<String, Object>> sources = (List<Map<String, Object>>) aiResult.getOrDefault("sources", Collections.emptyList());
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);

        return CollectionDto.CompareResponse.builder()
                .comparison(comparison)
                .sources(sources)
                .mock(isMock)
                .build();
    }
}
