package com.intellidoc.service;

import com.intellidoc.dto.WorkspaceDto;
import com.intellidoc.entity.User;
import com.intellidoc.entity.Workspace;
import com.intellidoc.entity.WorkspaceMember;
import com.intellidoc.repository.SummaryRepository;
import com.intellidoc.repository.UserRepository;
import com.intellidoc.repository.WorkspaceMemberRepository;
import com.intellidoc.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkspaceService {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SummaryRepository summaryRepository;

    public WorkspaceDto.Response createWorkspace(Long ownerId, WorkspaceDto.CreateRequest request) {
        Workspace ws = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .ownerId(ownerId)
                .build();
        Workspace saved = workspaceRepository.save(ws);

        // Add creator as OWNER member
        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspaceId(saved.getId())
                .userId(ownerId)
                .role("OWNER")
                .build();
        workspaceMemberRepository.save(ownerMember);

        return mapToResponse(saved, "OWNER");
    }

    public List<WorkspaceDto.Response> getUserWorkspaces(Long userId) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserId(userId);
        List<WorkspaceDto.Response> results = new ArrayList<>();

        for (WorkspaceMember m : memberships) {
            Optional<Workspace> wsOpt = workspaceRepository.findById(m.getWorkspaceId());
            wsOpt.ifPresent(ws -> results.add(mapToResponse(ws, m.getRole())));
        }
        return results;
    }

    public WorkspaceDto.Response getWorkspace(Long workspaceId, Long userId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new SecurityException("User is not a member of this workspace"));
        return mapToResponse(ws, member.getRole());
    }

    public WorkspaceDto.MemberResponse addMember(Long workspaceId, Long requesterId, WorkspaceDto.AddMemberRequest request) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        WorkspaceMember requester = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId)
                .orElseThrow(() -> new SecurityException("Unauthorized"));

        if (!"OWNER".equalsIgnoreCase(requester.getRole()) && !"EDITOR".equalsIgnoreCase(requester.getRole())) {
            throw new SecurityException("Only workspace owners or editors can add members");
        }

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User with email " + request.getEmail() + " not found"));

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, targetUser.getId())) {
            throw new IllegalArgumentException("User is already a member of this workspace");
        }

        String role = (request.getRole() != null && !request.getRole().isBlank()) 
                ? request.getRole().toUpperCase() : "VIEWER";

        WorkspaceMember newMember = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(targetUser.getId())
                .role(role)
                .build();
        WorkspaceMember saved = workspaceMemberRepository.save(newMember);

        return WorkspaceDto.MemberResponse.builder()
                .id(saved.getId())
                .userId(targetUser.getId())
                .email(targetUser.getEmail())
                .name(targetUser.getName())
                .role(saved.getRole())
                .joinedAt(saved.getJoinedAt())
                .build();
    }

    public List<WorkspaceDto.MemberResponse> getMembers(Long workspaceId, Long userId) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new SecurityException("Unauthorized to view workspace members");
        }
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(workspaceId);
        return members.stream().map(m -> {
            Optional<User> userOpt = userRepository.findById(m.getUserId());
            String email = userOpt.map(User::getEmail).orElse("Unknown");
            String name = userOpt.map(User::getName).orElse("User");
            return WorkspaceDto.MemberResponse.builder()
                    .id(m.getId())
                    .userId(m.getUserId())
                    .email(email)
                    .name(name)
                    .role(m.getRole())
                    .joinedAt(m.getJoinedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private WorkspaceDto.Response mapToResponse(Workspace ws, String currentUserRole) {
        long memberCount = workspaceMemberRepository.findByWorkspaceId(ws.getId()).size();
        long summaryCount = summaryRepository.findByWorkspaceIdOrderByGeneratedAtDesc(ws.getId()).size();
        return WorkspaceDto.Response.builder()
                .id(ws.getId())
                .name(ws.getName())
                .description(ws.getDescription())
                .ownerId(ws.getOwnerId())
                .currentUserRole(currentUserRole)
                .memberCount((int) memberCount)
                .summaryCount((int) summaryCount)
                .createdAt(ws.getCreatedAt())
                .updatedAt(ws.getUpdatedAt())
                .build();
    }
}
