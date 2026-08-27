package com.intellidoc.service;

import com.intellidoc.dto.StudyMaterialDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StudyMaterialService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    public StudyMaterialDto.StudyMaterialResponse generateStudyMaterial(Long docId, Long userId, StudyMaterialDto.StudyMaterialRequest request) {
        Document doc = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + docId));

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId);

        StringBuilder fullTextBuilder = new StringBuilder();
        List<Map<String, Object>> chunksData = new ArrayList<>();
        for (DocumentChunk c : chunks) {
            fullTextBuilder.append(c.getText()).append("\n\n");
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("chunk_index", c.getChunkIndex());
            cMap.put("text", c.getText());
            cMap.put("page_number", c.getPageNumber());
            cMap.put("section", c.getSection());
            chunksData.add(cMap);
        }

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("document_id", docId.toString());
        aiRequest.put("text", fullTextBuilder.toString());
        aiRequest.put("chunks", chunksData);
        aiRequest.put("difficulty", request.getDifficulty() != null ? request.getDifficulty() : "medium");
        aiRequest.put("types", request.getTypes() != null ? request.getTypes() : List.of("mcq", "short_answer", "flashcard"));
        aiRequest.put("count", request.getCount() != null ? request.getCount() : 5);

        Map<String, Object> aiResult = aiServiceClient.generateStudyMaterial(aiRequest);

        List<Map<String, Object>> questions = (List<Map<String, Object>>) aiResult.getOrDefault("questions", Collections.emptyList());
        Boolean isMock = (Boolean) aiResult.getOrDefault("mock", false);
        String diff = (String) aiResult.getOrDefault("difficulty", "medium");

        return StudyMaterialDto.StudyMaterialResponse.builder()
                .questions(questions)
                .mock(isMock)
                .difficulty(diff)
                .build();
    }
}
