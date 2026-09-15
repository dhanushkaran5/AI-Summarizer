package com.intellidoc.controller;

import com.intellidoc.dto.ApiKeyDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.ApiKeyService;
import com.intellidoc.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/keys")
public class ApiKeyController {

    @Autowired
    private ApiKeyService apiKeyService;

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
    public ResponseEntity<ApiKeyDto.CreateKeyResponse> createKey(
            @RequestBody ApiKeyDto.CreateKeyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(apiKeyService.createApiKey(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyDto.KeyResponse>> getUserKeys(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(apiKeyService.getUserKeys(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeKey(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        apiKeyService.revokeApiKey(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/usage")
    public ResponseEntity<List<ApiKeyDto.UsageLogResponse>> getKeyUsage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(apiKeyService.getKeyUsageLogs(userId, id));
    }
}
