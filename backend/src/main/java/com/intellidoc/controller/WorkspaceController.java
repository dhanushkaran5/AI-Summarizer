package com.intellidoc.controller;

import com.intellidoc.dto.SummarizeV2Dto;
import com.intellidoc.dto.WorkspaceDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.SummaryV2Service;
import com.intellidoc.service.WorkspaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private SummaryV2Service summaryV2Service;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails != null) {
            User user = authService.getUserByEmail(userDetails.getUsername());
            return user.getId();
        }
        return 1L;
    }

    @PostMapping
    public ResponseEntity<WorkspaceDto.Response> createWorkspace(
            @RequestBody WorkspaceDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(workspaceService.createWorkspace(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceDto.Response>> getUserWorkspaces(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(workspaceService.getUserWorkspaces(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDto.Response> getWorkspace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(workspaceService.getWorkspace(id, userId));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<WorkspaceDto.MemberResponse> addMember(
            @PathVariable Long id,
            @RequestBody WorkspaceDto.AddMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(workspaceService.addMember(id, userId, request));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<WorkspaceDto.MemberResponse>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(workspaceService.getMembers(id, userId));
    }

    @GetMapping("/{id}/summaries")
    public ResponseEntity<List<SummarizeV2Dto.Response>> getWorkspaceSummaries(@PathVariable Long id) {
        return ResponseEntity.ok(summaryV2Service.getWorkspaceSummaries(id));
    }
}
