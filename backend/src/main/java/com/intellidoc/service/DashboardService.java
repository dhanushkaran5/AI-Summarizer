package com.intellidoc.service;

import com.intellidoc.dto.DashboardStatsDto;
import com.intellidoc.entity.Document;
import com.intellidoc.repository.ConversationRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    public DashboardStatsDto getDashboardStats(Long userId) {
        List<Document> documents = documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
        long totalDocs = documents.size();
        long processedDocs = documents.stream().filter(d -> "COMPLETED".equals(d.getStatus())).count();

        List<Long> docIds = documents.stream().map(Document::getId).collect(Collectors.toList());
        long summariesCount = docIds.isEmpty() ? 0 : summaryRepository.countByDocumentIdIn(docIds);
        long questionsAsked = conversationRepository.countByUserId(userId);

        return DashboardStatsDto.builder()
                .totalDocuments(totalDocs)
                .processedDocuments(processedDocs)
                .summariesGenerated(summariesCount)
                .questionsAsked(questionsAsked)
                .build();
    }
}
