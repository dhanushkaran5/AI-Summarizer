package com.intellidoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.entity.Summary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class ExportServiceTest {

    private ExportService exportService;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        exportService = new ExportService();
        objectMapper = new ObjectMapper();
        ReflectionTestUtils.setField(exportService, "objectMapper", objectMapper);
    }

    @Test
    public void testExportPdfDocxMarkdown() throws Exception {
        Summary summary = Summary.builder()
                .id(1L)
                .title("Quarterly AI Synthesis")
                .summaryText("This is an executive brief of the quarterly AI research findings.")
                .mode("HYBRID")
                .length("STANDARD")
                .persona("Executive")
                .confidenceScore(0.95)
                .sectionsJson("[{\"id\":\"exec_summary\",\"title\":\"Executive Summary\",\"content\":\"Key findings summarized.\"}]")
                .insightsJson("[{\"id\":\"1\",\"title\":\"Productivity Surge\",\"insight\":\"Engineers report 40% gain\",\"whyThisMatters\":\"Faster time to market\",\"importance\":\"high\"}]")
                .generatedAt(LocalDateTime.now())
                .build();

        // 1. PDF
        byte[] pdfBytes = exportService.exportToPdf(summary);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF should contain valid byte stream");

        // 2. DOCX
        byte[] docxBytes = exportService.exportToDocx(summary);
        assertNotNull(docxBytes);
        assertTrue(docxBytes.length > 500, "DOCX should contain valid byte stream");

        // 3. Markdown
        String markdown = exportService.exportToMarkdown(summary);
        assertNotNull(markdown);
        assertTrue(markdown.contains("Quarterly AI Synthesis"));
        assertTrue(markdown.contains("HYBRID"));
    }
}
