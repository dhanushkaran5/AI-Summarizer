package com.intellidoc.service;

import com.intellidoc.dto.MultiLevelSummaryDto;
import com.intellidoc.entity.Document;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.SummaryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SummaryServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private SummaryRepository summaryRepository;

    @Mock
    private AIServiceClient aiServiceClient;

    @InjectMocks
    private SummaryService summaryService;

    @Test
    public void testGenerateMultiLevelSummary() {
        Long docId = 1L;
        Long userId = 100L;

        Document doc = Document.builder()
                .id(docId)
                .userId(userId)
                .originalName("test.pdf")
                .fileType("pdf")
                .build();

        when(documentRepository.findByIdAndUserId(docId, userId)).thenReturn(Optional.of(doc));
        when(documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId)).thenReturn(Collections.emptyList());

        Map<String, Object> mockAiRes = new HashMap<>();
        mockAiRes.put("level_0", "This document presents system architecture.");
        mockAiRes.put("level_1", "Executive summary of system.");
        mockAiRes.put("level_2", Map.of("Architecture", "Detailed architecture"));
        mockAiRes.put("level_3", List.of(Map.of("section", "Intro", "summary", "Summary")));
        mockAiRes.put("level_4", "Technical analysis");
        mockAiRes.put("level_5", List.of(Map.of("question", "Q1", "answer", "A1")));
        mockAiRes.put("mock", true);

        when(aiServiceClient.getMultiLevelSummary(any())).thenReturn(mockAiRes);

        MultiLevelSummaryDto.Request req = MultiLevelSummaryDto.Request.builder()
                .mode("technical")
                .targetLevel(2)
                .build();

        MultiLevelSummaryDto.Response response = summaryService.generateMultiLevelSummary(docId, userId, req);

        assertNotNull(response);
        assertEquals("technical", response.getMode());
        assertEquals("This document presents system architecture.", response.getLevel0());
        assertTrue(response.getMock());
    }
}
