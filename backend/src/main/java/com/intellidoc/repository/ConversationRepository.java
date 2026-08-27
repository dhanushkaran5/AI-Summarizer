package com.intellidoc.repository;

import com.intellidoc.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByDocumentIdAndUserIdOrderByCreatedAtDesc(Long documentId, Long userId);
    List<Conversation> findByCollectionIdAndUserIdOrderByCreatedAtDesc(Long collectionId, Long userId);
    Optional<Conversation> findFirstByDocumentIdAndUserIdOrderByCreatedAtDesc(Long documentId, Long userId);
    long countByUserId(Long userId);
}
