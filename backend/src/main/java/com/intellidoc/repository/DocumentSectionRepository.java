package com.intellidoc.repository;

import com.intellidoc.entity.DocumentSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentSectionRepository extends JpaRepository<DocumentSection, Long> {
    List<DocumentSection> findByDocumentIdOrderBySectionOrderAsc(Long documentId);
    void deleteByDocumentId(Long documentId);
}
