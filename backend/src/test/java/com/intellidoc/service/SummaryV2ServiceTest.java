package com.intellidoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.SummarizeV2Dto;
import com.intellidoc.entity.Summary;
import com.intellidoc.entity.SummaryVersion;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.SummaryRepository;
import com.intellidoc.repository.SummaryVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SummaryV2ServiceTest {

    @Mock
    private SummaryRepository summaryRepository;

    @Mock
    private SummaryVersionRepository summaryVersionRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private AIServiceClient aiServiceClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SummaryV2Service summaryV2Service;

    @BeforeEach
    public void setup() {
        ReflectionTestUtils.setField(summaryV2Service, "objectMapper", objectMapper);
    }

    @Test
    public void testGenerateSummaryAndInitialVersion() {
        Long userId = 1L;
        String text = "Artificial intelligence accelerates document analysis with verifiable metrics and transparency.";

        Map<String, Object> mockAiRes = new HashMap<>();
        mockAiRes.put("summary_text", "AI accelerates document analysis with verified metrics.");
        mockAiRes.put("mode", "hybrid");
        mockAiRes.put("length", "standard");
        mockAiRes.put("persona", "executive");
        mockAiRes.put("persona_title", "Executive");
        mockAiRes.put("sections", List.of(Map.of("id", "exec_summary", "title", "Executive Summary", "content", "AI accelerates analysis.")));
        mockAiRes.put("quality_metrics", Map.of("compression_ratio", 60.0, "confidence", Map.of("overall_score", 0.92)));
        mockAiRes.put("insights", List.of(Map.of("id", "1", "title", "AI Impact", "insight", "High impact", "whyThisMatters", "Speeds up workflows", "importance", "high")));
        mockAiRes.put("processing_time_ms", 150L);

        when(aiServiceClient.summarizeV2(any())).thenReturn(mockAiRes);

        Summary savedSummary = Summary.builder()
                .id(10L)
                .userId(userId)
                .title("Document Analysis")
                .summaryText("AI accelerates document analysis with verified metrics.")
                .mode("HYBRID")
                .length("STANDARD")
                .persona("Executive")
                .currentVersion(1)
                .confidenceScore(0.92)
                .compressionRatio(60.0)
                .build();

        when(summaryRepository.save(any(Summary.class))).thenReturn(savedSummary);
        when(summaryVersionRepository.save(any(SummaryVersion.class))).thenAnswer(i -> i.getArgument(0));

        SummarizeV2Dto.Request req = SummarizeV2Dto.Request.builder()
                .text(text)
                .mode("HYBRID")
                .length("STANDARD")
                .persona("Executive")
                .build();

        SummarizeV2Dto.Response res = summaryV2Service.generateSummary(userId, req);

        assertNotNull(res);
        assertEquals("HYBRID", res.getMode());
        assertEquals("Executive", res.getPersona());
        assertEquals(1, res.getCurrentVersion());
        assertEquals(0.92, res.getConfidenceScore());
    }

    @Test
    public void testNonDestructiveVersionRestore() {
        Long summaryId = 5L;
        Long userId = 1L;

        Summary existing = Summary.builder()
                .id(summaryId)
                .userId(userId)
                .summaryText("Current version 2 text")
                .currentVersion(2)
                .persona("Executive")
                .build();

        SummaryVersion v1 = SummaryVersion.builder()
                .id(101L)
                .summaryId(summaryId)
                .versionNumber(1)
                .summaryText("Version 1 original text")
                .persona("Academic")
                .confidenceScore(0.88)
                .compressionRatio(55.0)
                .build();

        when(summaryRepository.findById(summaryId)).thenReturn(Optional.of(existing));
        when(summaryVersionRepository.findBySummaryIdAndVersionNumber(summaryId, 1)).thenReturn(Optional.of(v1));
        when(summaryRepository.save(any(Summary.class))).thenAnswer(i -> i.getArgument(0));
        when(summaryVersionRepository.save(any(SummaryVersion.class))).thenAnswer(i -> i.getArgument(0));

        SummarizeV2Dto.Response restored = summaryV2Service.restoreVersion(
                summaryId, 1, userId, SummarizeV2Dto.RestoreRequest.builder().changeNote("Restoring V1").build());

        assertNotNull(restored);
        assertEquals(3, restored.getCurrentVersion()); // Version incremented from 2 to 3!
        assertEquals("Version 1 original text", restored.getSummaryText());
        assertEquals("Academic", restored.getPersona());
    }
}
