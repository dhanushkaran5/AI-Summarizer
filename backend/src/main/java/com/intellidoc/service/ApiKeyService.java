package com.intellidoc.service;

import com.intellidoc.dto.ApiKeyDto;
import com.intellidoc.entity.ApiKey;
import com.intellidoc.entity.ApiUsageLog;
import com.intellidoc.repository.ApiKeyRepository;
import com.intellidoc.repository.ApiUsageLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApiKeyService {

    @Autowired
    private ApiKeyRepository apiKeyRepository;

    @Autowired
    private ApiUsageLogRepository apiUsageLogRepository;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    public ApiKeyDto.CreateKeyResponse createApiKey(Long userId, ApiKeyDto.CreateKeyRequest request) {
        byte[] randomBytes = new byte[24];
        SECURE_RANDOM.nextBytes(randomBytes);
        String secretPart = HexFormat.of().formatHex(randomBytes);
        String rawKey = "sum_ai_live_" + secretPart;
        String prefix = rawKey.substring(0, 18) + "...";
        String hash = hashKey(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .userId(userId)
                .name(request.getName() != null && !request.getName().isBlank() ? request.getName() : "Default API Key")
                .keyPrefix(prefix)
                .keyHash(hash)
                .rateLimitPerMinute(request.getRateLimitPerMinute() != null && request.getRateLimitPerMinute() > 0 
                        ? request.getRateLimitPerMinute() : 60)
                .active(true)
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);

        return ApiKeyDto.CreateKeyResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .rawKey(rawKey) // Given to client ONCE
                .keyPrefix(prefix)
                .rateLimitPerMinute(saved.getRateLimitPerMinute())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<ApiKeyDto.KeyResponse> getUserKeys(Long userId) {
        return apiKeyRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(k -> ApiKeyDto.KeyResponse.builder()
                        .id(k.getId())
                        .name(k.getName())
                        .keyPrefix(k.getKeyPrefix())
                        .rateLimitPerMinute(k.getRateLimitPerMinute())
                        .active(k.getActive())
                        .lastUsedAt(k.getLastUsedAt())
                        .createdAt(k.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public void revokeApiKey(Long userId, Long keyId) {
        ApiKey key = apiKeyRepository.findById(keyId)
                .orElseThrow(() -> new IllegalArgumentException("API key not found"));
        if (!key.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized to revoke this API key");
        }
        key.setActive(false);
        apiKeyRepository.save(key);
    }

    public Optional<ApiKey> validateApiKey(String rawKey) {
        if (rawKey == null || !rawKey.startsWith("sum_ai_live_")) {
            return Optional.empty();
        }
        String hash = hashKey(rawKey);
        Optional<ApiKey> keyOpt = apiKeyRepository.findByKeyHashAndActiveTrue(hash);
        keyOpt.ifPresent(key -> {
            key.setLastUsedAt(LocalDateTime.now());
            apiKeyRepository.save(key);
        });
        return keyOpt;
    }

    public void logApiUsage(Long apiKeyId, String endpoint, String method, int status, long durationMs) {
        try {
            ApiUsageLog log = ApiUsageLog.builder()
                    .apiKeyId(apiKeyId)
                    .endpoint(endpoint)
                    .httpMethod(method)
                    .responseStatus(status)
                    .responseTimeMs(durationMs)
                    .build();
            apiUsageLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

    public List<ApiKeyDto.UsageLogResponse> getKeyUsageLogs(Long userId, Long keyId) {
        ApiKey key = apiKeyRepository.findById(keyId)
                .orElseThrow(() -> new IllegalArgumentException("API key not found"));
        if (!key.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized to view this API key's logs");
        }
        return apiUsageLogRepository.findByApiKeyIdOrderByTimestampDesc(keyId).stream()
                .limit(100)
                .map(l -> ApiKeyDto.UsageLogResponse.builder()
                        .id(l.getId())
                        .apiKeyId(l.getApiKeyId())
                        .endpoint(l.getEndpoint())
                        .httpMethod(l.getHttpMethod())
                        .responseStatus(l.getResponseStatus())
                        .responseTimeMs(l.getResponseTimeMs())
                        .timestamp(l.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
}
