package com.intellidoc.repository;

import com.intellidoc.entity.ProcessingJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessingJobRepository extends JpaRepository<ProcessingJob, Long> {
    Optional<ProcessingJob> findByJobId(String jobId);
    Optional<ProcessingJob> findFirstByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
