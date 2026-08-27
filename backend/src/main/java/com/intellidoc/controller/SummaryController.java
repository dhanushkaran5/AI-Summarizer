package com.intellidoc.controller;

import com.intellidoc.dto.MultiLevelSummaryDto;
import com.intellidoc.dto.SummarizeDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.SummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class SummaryController {

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @PostMapping("/{docId}/summarize/multi-level")
    public ResponseEntity<MultiLevelSummaryDto.Response> generateMultiLevelSummary(@PathVariable Long docId,
                                                                                   @RequestBody MultiLevelSummaryDto.Request request,
                                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(summaryService.generateMultiLevelSummary(docId, userId, request));
    }

    @PostMapping("/{docId}/summarize")
    public ResponseEntity<SummarizeDto.SummaryResponse> generateSummary(@PathVariable Long docId,
                                                                          @RequestBody SummarizeDto.SummarizeRequest request,
                                                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(summaryService.generateSummary(docId, userId, request));
    }

    @GetMapping("/{docId}/summaries")
    public ResponseEntity<List<SummarizeDto.SummaryResponse>> getSummariesByDocument(@PathVariable Long docId,
                                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(summaryService.getSummariesByDocument(docId, userId));
    }
}
