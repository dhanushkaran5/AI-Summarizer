package com.intellidoc.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.SummarizeV2Dto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.entity.Summary;
import com.intellidoc.entity.SummaryVersion;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.SummaryRepository;
import com.intellidoc.repository.SummaryVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SummaryV2Service {

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private SummaryVersionRepository summaryVersionRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public SummarizeV2Dto.Response generateSummary(Long userId, SummarizeV2Dto.Request request) {
        String inputText = request.getText();
        String docTitle = request.getTitle();

        // If documentId is provided, retrieve document text
        if (request.getDocumentId() != null) {
            Document doc = documentRepository.findById(request.getDocumentId())
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));
            if (docTitle == null || docTitle.isBlank()) {
                docTitle = doc.getOriginalName();
            }
            if (inputText == null || inputText.isBlank()) {
                List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(doc.getId());
                StringBuilder sb = new StringBuilder();
                for (DocumentChunk c : chunks) {
                    sb.append(c.getText()).append("\n\n");
                }
                inputText = sb.toString();
            }
        }

        if (inputText == null || inputText.trim().length() < 20) {
            throw new IllegalArgumentException("Text is too short to summarize. Provide at least 20 characters.");
        }

        if (docTitle == null || docTitle.isBlank()) {
            String firstLine = inputText.trim().split("\n")[0];
            docTitle = firstLine.length() > 60 ? firstLine.substring(0, 57) + "..." : firstLine;
        }

        Map<String, Object> aiReq = new HashMap<>();
        aiReq.put("text", inputText);
        aiReq.put("mode", request.getMode() != null ? request.getMode().toLowerCase() : "hybrid");
        aiReq.put("length", request.getLength() != null ? request.getLength().toLowerCase() : "standard");
        aiReq.put("persona", request.getPersona() != null ? request.getPersona().toLowerCase() : "executive");
        aiReq.put("language", request.getLanguage() != null ? request.getLanguage() : "auto");

        Map<String, Object> aiRes = aiServiceClient.summarizeV2(aiReq);

        String summaryText = (String) aiRes.getOrDefault("summary_text", "");
        String mode = (String) aiRes.getOrDefault("mode", request.getMode());
        String length = (String) aiRes.getOrDefault("length", request.getLength());
        String persona = (String) aiRes.getOrDefault("persona", request.getPersona());
        String personaTitle = (String) aiRes.getOrDefault("persona_title", "Executive");

        Object sectionsObj = aiRes.get("sections");
        Object metricsObj = aiRes.get("quality_metrics");
        Object sentimentObj = aiRes.get("sentiment");
        Object insightsObj = aiRes.get("insights");
        Object traceObj = aiRes.get("traceability");
        Object langObj = aiRes.get("language");

        String sectionsJson = toJson(sectionsObj);
        String metricsJson = toJson(metricsObj);
        String sentimentJson = toJson(sentimentObj);
        String insightsJson = toJson(insightsObj);
        String traceJson = toJson(traceObj);

        Double confidence = extractConfidence(metricsObj);
        Double compression = extractCompression(metricsObj);
        Long procTime = extractLong(aiRes.get("processing_time_ms"));

        Summary summary = Summary.builder()
                .userId(userId)
                .documentId(request.getDocumentId())
                .workspaceId(request.getWorkspaceId())
                .title(docTitle)
                .summaryText(summaryText)
                .mode(mode != null ? mode.toUpperCase() : "HYBRID")
                .length(length != null ? length.toUpperCase() : "STANDARD")
                .persona(persona != null ? persona : "Executive")
                .confidenceScore(confidence)
                .compressionRatio(compression)
                .processingTimeMs(procTime)
                .sectionsJson(sectionsJson)
                .qualityMetricsJson(metricsJson)
                .sentimentJson(sentimentJson)
                .insightsJson(insightsJson)
                .traceabilityJson(traceJson)
                .currentVersion(1)
                .build();

        Summary saved = summaryRepository.save(summary);

        // Record Initial Version (Version 1)
        SummaryVersion v1 = SummaryVersion.builder()
                .summaryId(saved.getId())
                .versionNumber(1)
                .summaryText(saved.getSummaryText())
                .sectionsJson(saved.getSectionsJson())
                .persona(saved.getPersona())
                .length(saved.getLength())
                .mode(saved.getMode())
                .confidenceScore(saved.getConfidenceScore())
                .compressionRatio(saved.getCompressionRatio())
                .changeNote("Initial summary generated")
                .createdBy(userId)
                .build();
        summaryVersionRepository.save(v1);

        return mapToResponse(saved, personaTitle, langObj, sectionsObj, metricsObj, sentimentObj, insightsObj, traceObj);
    }

    public List<SummarizeV2Dto.Response> getUserSummaries(Long userId) {
        return summaryRepository.findByUserIdOrderByGeneratedAtDesc(userId).stream()
                .map(this::mapSummaryEntityToDto)
                .collect(Collectors.toList());
    }

    public List<SummarizeV2Dto.Response> getWorkspaceSummaries(Long workspaceId) {
        return summaryRepository.findByWorkspaceIdOrderByGeneratedAtDesc(workspaceId).stream()
                .map(this::mapSummaryEntityToDto)
                .collect(Collectors.toList());
    }

    public SummarizeV2Dto.Response getSummaryById(Long id) {
        Summary s = summaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found with ID: " + id));
        return mapSummaryEntityToDto(s);
    }

    public List<SummarizeV2Dto.VersionResponse> getVersions(Long summaryId) {
        return summaryVersionRepository.findBySummaryIdOrderByVersionNumberDesc(summaryId).stream()
                .map(v -> SummarizeV2Dto.VersionResponse.builder()
                        .id(v.getId())
                        .summaryId(v.getSummaryId())
                        .versionNumber(v.getVersionNumber())
                        .summaryText(v.getSummaryText())
                        .sections(fromJson(v.getSectionsJson(), Object.class))
                        .persona(v.getPersona())
                        .length(v.getLength())
                        .mode(v.getMode())
                        .confidenceScore(v.getConfidenceScore())
                        .compressionRatio(v.getCompressionRatio())
                        .changeNote(v.getChangeNote())
                        .restoredFromVersion(v.getRestoredFromVersion())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SummarizeV2Dto.Response restoreVersion(Long summaryId, Integer versionNumber, Long userId, SummarizeV2Dto.RestoreRequest request) {
        Summary summary = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found"));

        SummaryVersion targetVersion = summaryVersionRepository.findBySummaryIdAndVersionNumber(summaryId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException("Version " + versionNumber + " not found"));

        int nextVersionNumber = summary.getCurrentVersion() + 1;

        // Non-destructive update: update current view with target version content
        summary.setSummaryText(targetVersion.getSummaryText());
        summary.setSectionsJson(targetVersion.getSectionsJson());
        summary.setPersona(targetVersion.getPersona());
        summary.setLength(targetVersion.getLength());
        summary.setMode(targetVersion.getMode());
        summary.setConfidenceScore(targetVersion.getConfidenceScore());
        summary.setCompressionRatio(targetVersion.getCompressionRatio());
        summary.setCurrentVersion(nextVersionNumber);
        summary.setUpdatedAt(LocalDateTime.now());

        Summary updated = summaryRepository.save(summary);

        // Record brand new version representing the restore
        String note = (request != null && request.getChangeNote() != null && !request.getChangeNote().isBlank())
                ? request.getChangeNote()
                : "Restored from version " + versionNumber;

        SummaryVersion newVersionRecord = SummaryVersion.builder()
                .summaryId(summary.getId())
                .versionNumber(nextVersionNumber)
                .summaryText(updated.getSummaryText())
                .sectionsJson(updated.getSectionsJson())
                .persona(updated.getPersona())
                .length(updated.getLength())
                .mode(updated.getMode())
                .confidenceScore(updated.getConfidenceScore())
                .compressionRatio(updated.getCompressionRatio())
                .changeNote(note)
                .restoredFromVersion(versionNumber)
                .createdBy(userId)
                .build();
        summaryVersionRepository.save(newVersionRecord);

        return mapSummaryEntityToDto(updated);
    }

    private SummarizeV2Dto.Response mapSummaryEntityToDto(Summary s) {
        return mapToResponse(
                s,
                s.getPersona(),
                null,
                fromJson(s.getSectionsJson(), Object.class),
                fromJson(s.getQualityMetricsJson(), Object.class),
                fromJson(s.getSentimentJson(), Object.class),
                fromJson(s.getInsightsJson(), Object.class),
                fromJson(s.getTraceabilityJson(), Object.class)
        );
    }

    private SummarizeV2Dto.Response mapToResponse(
            Summary s, String personaTitle, Object lang, Object sec, Object metrics, Object sent, Object ins, Object trace) {
        return SummarizeV2Dto.Response.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .documentId(s.getDocumentId())
                .workspaceId(s.getWorkspaceId())
                .title(s.getTitle())
                .summaryText(s.getSummaryText())
                .mode(s.getMode())
                .length(s.getLength())
                .persona(s.getPersona())
                .personaTitle(personaTitle)
                .currentVersion(s.getCurrentVersion())
                .confidenceScore(s.getConfidenceScore())
                .compressionRatio(s.getCompressionRatio())
                .processingTimeMs(s.getProcessingTimeMs())
                .language(lang)
                .sections(sec)
                .qualityMetrics(metrics)
                .sentiment(sent)
                .insights(ins)
                .traceability(trace)
                .createdAt(s.getGeneratedAt())
                .build();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            return null;
        }
    }

    private Double extractConfidence(Object metricsObj) {
        if (metricsObj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) metricsObj;
            Object confObj = map.get("confidence");
            if (confObj instanceof Map) {
                Object score = ((Map<?, ?>) confObj).get("overall_score");
                if (score instanceof Number) return ((Number) score).doubleValue();
            }
        }
        return 0.90;
    }

    private Double extractCompression(Object metricsObj) {
        if (metricsObj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) metricsObj;
            Object comp = map.get("compression_ratio");
            if (comp instanceof Number) return ((Number) comp).doubleValue();
        }
        return 65.0;
    }

    private Long extractLong(Object val) {
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return 120L;
    }
}
