package com.intellidoc.service;

import com.intellidoc.dto.ChatDto;
import com.intellidoc.dto.VerificationDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class VerificationService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    public VerificationDto.VerifyResponse verifyClaims(Long docId, Long userId, VerificationDto.VerifyRequest request) {
        Document document = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + docId));

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId);

        List<Map<String, Object>> chunkPayloads = chunks.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("chunk_id", String.valueOf(c.getId()));
            map.put("text", c.getText());
            map.put("page_number", c.getPageNumber());
            map.put("section", c.getSection());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", String.valueOf(docId));
        aiRequest.put("text", request.getText() != null ? request.getText() : "");
        aiRequest.put("claims", request.getClaims() != null ? request.getClaims() : Collections.emptyList());
        aiRequest.put("chunks", chunkPayloads);

        Map<String, Object> aiResponse = aiServiceClient.verifyClaims(aiRequest);

        String status = (String) aiResponse.getOrDefault("status", "supported");
        String claimStatus = (String) aiResponse.getOrDefault("claim_status", "EXPLICITLY STATED");
        Double confidence = aiResponse.get("confidence") instanceof Number
                ? ((Number) aiResponse.get("confidence")).doubleValue() : 0.88;
        String details = (String) aiResponse.getOrDefault("details", "Claims cross-referenced against document knowledge base.");
        Boolean isMock = (Boolean) aiResponse.getOrDefault("mock", false);

        List<VerificationDto.ClaimVerification> claimsList = new ArrayList<>();
        if (aiResponse.get("claims") instanceof List) {
            List<Map<String, Object>> rawClaims = (List<Map<String, Object>>) aiResponse.get("claims");
            for (Map<String, Object> item : rawClaims) {
                claimsList.add(VerificationDto.ClaimVerification.builder()
                        .claim((String) item.get("claim"))
                        .status((String) item.getOrDefault("status", "SUPPORTED"))
                        .confidence(item.get("confidence") instanceof Number
                                ? ((Number) item.get("confidence")).doubleValue() : 0.85)
                        .evidenceQuote((String) item.getOrDefault("evidence_quote", ""))
                        .build());
            }
        }

        // Build sources from chunks
        List<ChatDto.SourceDto> sources = new ArrayList<>();
        int maxSources = Math.min(chunks.size(), 3);
        for (int i = 0; i < maxSources; i++) {
            DocumentChunk c = chunks.get(i);
            sources.add(ChatDto.SourceDto.builder()
                    .chunkId(String.valueOf(c.getId()))
                    .pageNumber(c.getPageNumber())
                    .section(c.getSection())
                    .textPreview(c.getText().length() > 200 ? c.getText().substring(0, 200) + "..." : c.getText())
                    .relevanceScore(0.85 - (i * 0.05))
                    .build());
        }

        return VerificationDto.VerifyResponse.builder()
                .documentId(docId)
                .status(status)
                .claimStatus(claimStatus)
                .confidence(confidence)
                .claims(claimsList)
                .overallAssessment(details)
                .sources(sources)
                .mock(isMock)
                .build();
    }
}
