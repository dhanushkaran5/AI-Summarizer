package com.intellidoc.controller;

import com.intellidoc.dto.SummarizeV2Dto;
import com.intellidoc.entity.ApiKey;
import com.intellidoc.entity.Summary;
import com.intellidoc.entity.User;
import com.intellidoc.repository.SummaryRepository;
import com.intellidoc.service.ApiKeyService;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.ExportService;
import com.intellidoc.service.SummaryV2Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/summaries")
public class SummaryV2Controller {

    @Autowired
    private SummaryV2Service summaryV2Service;

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private ExportService exportService;

    @Autowired
    private AuthService authService;

    @Autowired
    private ApiKeyService apiKeyService;

    private Long resolveUserId(UserDetails userDetails, String apiKeyHeader) {
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            Optional<ApiKey> apiKeyOpt = apiKeyService.validateApiKey(apiKeyHeader.trim());
            if (apiKeyOpt.isPresent()) {
                return apiKeyOpt.get().getUserId();
            }
        }
        if (userDetails != null) {
            User user = authService.getUserByEmail(userDetails.getUsername());
            return user.getId();
        }
        // Demo / Guest fallback
        return 1L;
    }

    @PostMapping
    public ResponseEntity<SummarizeV2Dto.Response> generateSummary(
            @RequestBody SummarizeV2Dto.Request request,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "X-API-Key", required = false) String apiKeyHeader) {
        Long userId = resolveUserId(userDetails, apiKeyHeader);
        SummarizeV2Dto.Response response = summaryV2Service.generateSummary(userId, request);
        return ResponseEntity.ok()
                .header("X-RateLimit-Limit", "60")
                .header("X-RateLimit-Remaining", "59")
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<SummarizeV2Dto.Response>> getUserSummaries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "X-API-Key", required = false) String apiKeyHeader) {
        Long userId = resolveUserId(userDetails, apiKeyHeader);
        return ResponseEntity.ok(summaryV2Service.getUserSummaries(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SummarizeV2Dto.Response> getSummaryById(@PathVariable Long id) {
        return ResponseEntity.ok(summaryV2Service.getSummaryById(id));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<SummarizeV2Dto.VersionResponse>> getVersions(@PathVariable Long id) {
        return ResponseEntity.ok(summaryV2Service.getVersions(id));
    }

    @PostMapping("/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<SummarizeV2Dto.Response> restoreVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber,
            @RequestBody(required = false) SummarizeV2Dto.RestoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "X-API-Key", required = false) String apiKeyHeader) {
        Long userId = resolveUserId(userDetails, apiKeyHeader);
        return ResponseEntity.ok(summaryV2Service.restoreVersion(id, versionNumber, userId, request));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportSummary(
            @PathVariable Long id,
            @RequestParam(defaultValue = "pdf") String format) {
        Summary summary = summaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Summary not found with ID: " + id));

        String filename = "summary-" + id;
        try {
            if ("docx".equalsIgnoreCase(format)) {
                byte[] data = exportService.exportToDocx(summary);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".docx\"")
                        .body(data);
            } else if ("markdown".equalsIgnoreCase(format) || "md".equalsIgnoreCase(format)) {
                String md = exportService.exportToMarkdown(summary);
                byte[] data = md.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_PLAIN)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".md\"")
                        .body(data);
            } else {
                // PDF Default
                byte[] data = exportService.exportToPdf(summary);
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".pdf\"")
                        .body(data);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate export: " + e.getMessage(), e);
        }
    }
}
