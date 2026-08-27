package com.intellidoc.repository;

import com.intellidoc.entity.Citation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitationRepository extends JpaRepository<Citation, Long> {
    List<Citation> findByMessageId(Long messageId);
    List<Citation> findByDocumentId(Long documentId);
}
