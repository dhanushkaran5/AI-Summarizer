package com.intellidoc.repository;

import com.intellidoc.entity.ApiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiUsageLogRepository extends JpaRepository<ApiUsageLog, Long> {
    List<ApiUsageLog> findByApiKeyIdOrderByTimestampDesc(Long apiKeyId);
    long countByApiKeyId(Long apiKeyId);
}
