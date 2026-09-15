package com.intellidoc.repository;

import com.intellidoc.entity.SummaryVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SummaryVersionRepository extends JpaRepository<SummaryVersion, Long> {
    List<SummaryVersion> findBySummaryIdOrderByVersionNumberDesc(Long summaryId);
    Optional<SummaryVersion> findBySummaryIdAndVersionNumber(Long summaryId, Integer versionNumber);
    long countBySummaryId(Long summaryId);
}
