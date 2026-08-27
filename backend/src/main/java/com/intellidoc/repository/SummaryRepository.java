package com.intellidoc.repository;

import com.intellidoc.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    List<Summary> findByDocumentIdOrderByGeneratedAtDesc(Long documentId);
    Optional<Summary> findFirstByDocumentIdOrderByGeneratedAtDesc(Long documentId);
    long countByDocumentIdIn(List<Long> documentIds);
}
