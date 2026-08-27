package com.intellidoc.repository;

import com.intellidoc.entity.CollectionDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionDocumentRepository extends JpaRepository<CollectionDocument, Long> {
    List<CollectionDocument> findByCollectionId(Long collectionId);
    Optional<CollectionDocument> findByCollectionIdAndDocumentId(Long collectionId, Long documentId);
    void deleteByCollectionIdAndDocumentId(Long collectionId, Long documentId);
    void deleteByCollectionId(Long collectionId);
}
