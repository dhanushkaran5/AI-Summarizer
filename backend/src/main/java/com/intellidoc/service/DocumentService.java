package com.intellidoc.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.*;
import com.intellidoc.entity.*;
import com.intellidoc.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private DocumentVersionRepository documentVersionRepository;

    @Autowired
    private ContradictionRepository contradictionRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    @Autowired
    private JobService jobService;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> uploadAndStartProcessing(MultipartFile file, Long userId) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
        String ext = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".txt";
        String storedFilename = UUID.randomUUID().toString() + ext;
        Path targetPath = uploadPath.resolve(storedFilename);

        Files.copy(file.getInputStream(), targetPath);

        // Initial Document DB Record
        Document doc = Document.builder()
                .userId(userId)
                .filename(storedFilename)
                .originalName(originalFilename)
                .fileType(ext.replace(".", "").toLowerCase())
                .fileSize(file.getSize())
                .status("UPLOADING")
                .uploadedAt(LocalDateTime.now())
                .build();

        doc = documentRepository.save(doc);

        // Record Initial Version
        DocumentVersion version = DocumentVersion.builder()
                .documentId(doc.getId())
                .versionNumber(1)
                .filename(storedFilename)
                .changeSummary("Initial document upload")
                .createdAt(LocalDateTime.now())
                .build();
        documentVersionRepository.save(version);

        // Create async tracking job
        ProcessingJob job = jobService.createJob(doc.getId(), userId);

        // Launch async pipeline in background
        jobService.processDocumentAsync(job, file, doc);

        Map<String, Object> response = new HashMap<>();
        response.put("document", doc);
        response.put("jobId", job.getJobId());
        return response;
    }

    public List<Document> getAllUserDocuments(Long userId) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public Document getDocumentById(Long id, Long userId) {
        return documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + id));
    }

    @Transactional
    public void deleteDocument(Long id, Long userId) {
        Document doc = getDocumentById(id, userId);
        documentChunkRepository.deleteByDocumentId(id);
        contradictionRepository.deleteByDocumentId(id);
        documentRepository.delete(doc);

        try {
            Path fileToDelete = Paths.get(uploadDir).resolve(doc.getFilename());
            Files.deleteIfExists(fileToDelete);
        } catch (Exception ignored) {}
    }

    public DocumentIntelligenceResponse getIntelligence(Long id, Long userId) {
        Document doc = getDocumentById(id, userId);
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);

        Set<String> sections = new HashSet<>();
        for (DocumentChunk c : chunks) {
            if (c.getSection() != null && !c.getSection().isBlank()) {
                sections.add(c.getSection());
            }
        }

        List<String> keywords = Collections.emptyList();
        if (doc.getKeywords() != null) {
            try {
                keywords = objectMapper.readValue(doc.getKeywords(), List.class);
            } catch (JsonProcessingException ignored) {}
        }

        List<String> keyConcepts = Collections.emptyList();
        if (doc.getKeyConcepts() != null) {
            try {
                keyConcepts = objectMapper.readValue(doc.getKeyConcepts(), List.class);
            } catch (JsonProcessingException ignored) {}
        }

        return DocumentIntelligenceResponse.builder()
                .pageCount(doc.getPageCount() != null ? doc.getPageCount() : 1)
                .wordCount(doc.getWordCount() != null ? doc.getWordCount() : 0)
                .charCount(doc.getCharCount() != null ? doc.getCharCount() : 0)
                .readingTimeMinutes(doc.getReadingTimeMinutes() != null ? doc.getReadingTimeMinutes() : 0.0)
                .sectionCount(Math.max(1, sections.size()))
                .chunkCount(chunks.size())
                .keywords(keywords)
                .keyConcepts(keyConcepts)
                .build();
    }

    public ContradictionDto.Response getContradictions(Long id, Long userId) {
        Document doc = getDocumentById(id, userId);
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);

        StringBuilder fullText = new StringBuilder();
        List<Map<String, Object>> chunksData = new ArrayList<>();
        for (DocumentChunk c : chunks) {
            fullText.append(c.getText()).append("\n\n");
            Map<String, Object> m = new HashMap<>();
            m.put("chunk_index", c.getChunkIndex());
            m.put("text", c.getText());
            m.put("section", c.getSection());
            m.put("page_number", c.getPageNumber());
            chunksData.add(m);
        }

        Map<String, Object> requestData = new HashMap<>();
        requestData.put("document_id", id.toString());
        requestData.put("text", fullText.toString());
        requestData.put("chunks", chunksData);

        Map<String, Object> aiResult = aiServiceClient.getContradictions(requestData);

        List<Map<String, Object>> rawList = (List<Map<String, Object>>) aiResult.getOrDefault("contradictions", Collections.emptyList());
        List<ContradictionDto.Item> items = new ArrayList<>();
        for (Map<String, Object> r : rawList) {
            items.add(ContradictionDto.Item.builder()
                    .statementA((String) r.get("statement_a"))
                    .sectionA((String) r.get("section_a"))
                    .pageA((Integer) r.get("page_a"))
                    .statementB((String) r.get("statement_b"))
                    .sectionB((String) r.get("section_b"))
                    .pageB((Integer) r.get("page_b"))
                    .explanation((String) r.get("explanation"))
                    .severity((String) r.getOrDefault("severity", "medium"))
                    .build());
        }

        return ContradictionDto.Response.builder()
                .documentId(id)
                .contradictions(items)
                .count(items.size())
                .mock((Boolean) aiResult.getOrDefault("mock", false))
                .build();
    }

    public KnowledgeMapDto getKnowledgeMap(Long id, Long userId) {
        Document doc = getDocumentById(id, userId);
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);

        StringBuilder fullText = new StringBuilder();
        List<Map<String, Object>> chunksData = new ArrayList<>();
        for (DocumentChunk c : chunks) {
            fullText.append(c.getText()).append("\n\n");
            Map<String, Object> m = new HashMap<>();
            m.put("chunk_index", c.getChunkIndex());
            m.put("text", c.getText());
            m.put("section", c.getSection());
            m.put("page_number", c.getPageNumber());
            chunksData.add(m);
        }

        Map<String, Object> requestData = new HashMap<>();
        requestData.put("document_id", id.toString());
        requestData.put("text", fullText.toString());
        requestData.put("chunks", chunksData);

        Map<String, Object> aiResult = aiServiceClient.getKnowledgeMap(requestData);

        return KnowledgeMapDto.builder()
                .documentId(id)
                .title((String) aiResult.getOrDefault("title", doc.getOriginalName()))
                .root((Map<String, Object>) aiResult.getOrDefault("root", Collections.emptyMap()))
                .mock((Boolean) aiResult.getOrDefault("mock", false))
                .build();
    }
}
