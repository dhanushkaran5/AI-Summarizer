package com.intellidoc.repository;

import com.intellidoc.entity.Contradiction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContradictionRepository extends JpaRepository<Contradiction, Long> {
    List<Contradiction> findByDocumentIdOrderByDetectedAtDesc(Long documentId);
    void deleteByDocumentId(Long documentId);
}
