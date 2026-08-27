package com.intellidoc.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.MultiLevelSummaryDto;
import com.intellidoc.dto.SummarizeDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.entity.Summary;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SummaryService {

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public MultiLevelSummaryDto.Response generateMultiLevelSummary(Long docId, Long userId, MultiLevelSummaryDto.Request request) {
        Document doc = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + docId));

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId);

        StringBuilder fullTextBuilder = new StringBuilder();
        List<Map<String, Object>> chunksData = new ArrayList<>();
        for (DocumentChunk c : chunks) {
            fullTextBuilder.append(c.getText()).append("\n\n");
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("chunk_index", c.getChunkIndex());
            cMap.put("text", c.getText());
            cMap.put("page_number", c.getPageNumber());
            cMap.put("section", c.getSection());
            chunksData.add(cMap);
        }

        String mode = request.getMode() != null ? request.getMode() : "student";

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", docId.toString());
        aiRequest.put("text", fullTextBuilder.toString());
        aiRequest.put("chunks", chunksData);
        aiRequest.put("mode", mode);
        aiRequest.put("target_level", request.getTargetLevel() != null ? request.getTargetLevel() : 2);

        Map<String, Object> aiResult = aiServiceClient.getMultiLevelSummary(aiRequest);

        String level0 = (String) aiResult.getOrDefault("level_0", "");
        String level1 = (String) aiResult.getOrDefault("level_1", "");
        Map<String, String> level2 = (Map<String, String>) aiResult.getOrDefault("level_2", Collections.emptyMap());
        List<Map<String, Object>> level3 = (List<Map<String, Object>>) aiResult.getOrDefault("level_3", Collections.emptyList());
        String level4 = (String) aiResult.getOrDefault("level_4", "");
        List<Map<String, String>> level5 = (List<Map<String, String>>) aiResult.getOrDefault("level_5", Collections.emptyList());
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);

        // Save into Summary entity
        String contentJson;
        try {
            contentJson = objectMapper.writeValueAsString(aiResult);
        } catch (JsonProcessingException e) {
            contentJson = "{}";
        }

        Summary summary = Summary.builder()
                .documentId(docId)
                .documentType(mode)
                .length("multi_level")
                .level(mode)
                .content(contentJson)
                .mock(isMock)
                .generatedAt(LocalDateTime.now())
                .build();

        summaryRepository.save(summary);

        return MultiLevelSummaryDto.Response.builder()
                .documentId(docId)
                .mode(mode)
                .level0(level0)
                .level1(level1)
                .level2(level2)
                .level3(level3)
                .level4(level4)
                .level5(level5)
                .mock(isMock)
                .build();
    }

    public SummarizeDto.SummaryResponse generateSummary(Long docId, Long userId, SummarizeDto.SummarizeRequest request) {
        Document doc = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + docId));

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId);

        StringBuilder fullTextBuilder = new StringBuilder();
        List<Map<String, Object>> chunksData = new ArrayList<>();
        for (DocumentChunk c : chunks) {
            fullTextBuilder.append(c.getText()).append("\n\n");
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("chunk_index", c.getChunkIndex());
            cMap.put("text", c.getText());
            cMap.put("page_number", c.getPageNumber());
            cMap.put("section", c.getSection());
            chunksData.add(cMap);
        }

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", docId.toString());
        aiRequest.put("text", fullTextBuilder.toString());
        aiRequest.put("chunks", chunksData);
        aiRequest.put("length", request.getLength() != null ? request.getLength() : "standard");
        aiRequest.put("level", request.getLevel() != null ? request.getLevel() : "student");
        if (request.getDocumentType() != null) {
            aiRequest.put("document_type", request.getDocumentType());
        }

        Map<String, Object> aiResult = aiServiceClient.summarizeDocument(aiRequest);

        String docType = (String) aiResult.getOrDefault("document_type", "general");
        Map<String, Object> summaryContent = (Map<String, Object>) aiResult.get("summary");
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);

        String contentJson;
        try {
            contentJson = objectMapper.writeValueAsString(summaryContent);
        } catch (JsonProcessingException e) {
            contentJson = "{}";
        }

        Summary summary = Summary.builder()
                .documentId(docId)
                .documentType(docType)
                .length(request.getLength() != null ? request.getLength() : "standard")
                .level(request.getLevel() != null ? request.getLevel() : "student")
                .content(contentJson)
                .mock(isMock)
                .generatedAt(LocalDateTime.now())
                .build();

        summary = summaryRepository.save(summary);

        return SummarizeDto.SummaryResponse.builder()
                .id(summary.getId())
                .documentId(docId)
                .documentType(docType)
                .length(summary.getLength())
                .level(summary.getLevel())
                .content(summaryContent)
                .generatedAt(summary.getGeneratedAt().toString())
                .mock(summary.getMock())
                .build();
    }

    public List<SummarizeDto.SummaryResponse> getSummariesByDocument(Long docId, Long userId) {
        documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + docId));

        List<Summary> summaries = summaryRepository.findByDocumentIdOrderByGeneratedAtDesc(docId);
        List<SummarizeDto.SummaryResponse> result = new ArrayList<>();

        for (Summary s : summaries) {
            Map<String, Object> contentMap;
            try {
                contentMap = objectMapper.readValue(s.getContent(), Map.class);
            } catch (Exception e) {
                contentMap = Collections.emptyMap();
            }

            result.add(SummarizeDto.SummaryResponse.builder()
                    .id(s.getId())
                    .documentId(s.getDocumentId())
                    .documentType(s.getDocumentType())
                    .length(s.getLength())
                    .level(s.getLevel())
                    .content(contentMap)
                    .generatedAt(s.getGeneratedAt().toString())
                    .mock(s.getMock())
                    .build());
        }

        return result;
    }
}
