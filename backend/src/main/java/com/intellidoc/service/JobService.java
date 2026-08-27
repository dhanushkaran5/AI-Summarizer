package com.intellidoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellidoc.dto.JobDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.entity.ProcessingJob;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import com.intellidoc.repository.ProcessingJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class JobService {

    @Autowired
    private ProcessingJobRepository processingJobRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProcessingJob createJob(Long documentId, Long userId) {
        String jobId = "job_" + UUID.randomUUID().toString().substring(0, 8);
        ProcessingJob job = ProcessingJob.builder()
                .jobId(jobId)
                .documentId(documentId)
                .userId(userId)
                .status("UPLOADING")
                .progressPercent(15)
                .currentStageDescription("File received and saved locally")
                .createdAt(LocalDateTime.now())
                .build();
        return processingJobRepository.save(job);
    }

    public JobDto getJobStatus(String jobId, Long userId) {
        ProcessingJob job = processingJobRepository.findByJobId(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!job.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to job: " + jobId);
        }

        return JobDto.builder()
                .jobId(job.getJobId())
                .documentId(job.getDocumentId())
                .status(job.getStatus())
                .progressPercent(job.getProgressPercent())
                .currentStageDescription(job.getCurrentStageDescription())
                .errorMessage(job.getErrorMessage())
                .diagnosticRemedy(job.getDiagnosticRemedy())
                .createdAt(job.getCreatedAt().toString())
                .completedAt(job.getCompletedAt() != null ? job.getCompletedAt().toString() : null)
                .build();
    }

    @Async
    public CompletableFuture<Void> processDocumentAsync(ProcessingJob job, MultipartFile file, Document doc) {
        try {
            // Stage 1: Extraction (35%)
            updateJobStage(job, "EXTRACTING", 35, "Extracting text and structure from document");
            doc.setStatus("EXTRACTING");
            documentRepository.save(doc);

            Map<String, Object> aiResult = aiServiceClient.extractDocument(file);

            doc.setPageCount((Integer) aiResult.getOrDefault("page_count", 1));
            doc.setWordCount((Integer) aiResult.getOrDefault("word_count", 0));
            doc.setCharCount((Integer) aiResult.getOrDefault("char_count", 0));
            Object readingTimeObj = aiResult.get("reading_time_minutes");
            if (readingTimeObj instanceof Number) {
                doc.setReadingTimeMinutes(((Number) readingTimeObj).doubleValue());
            }

            List<String> keywords = (List<String>) aiResult.getOrDefault("keywords", Collections.emptyList());
            doc.setKeywords(objectMapper.writeValueAsString(keywords));

            // Stage 2: Chunking & Structuring (60%)
            updateJobStage(job, "CHUNKING", 60, "Performing semantic segmentation and overlap chunking");
            doc.setStatus("CHUNKING");
            documentRepository.save(doc);

            List<Map<String, Object>> chunksData = (List<Map<String, Object>>) aiResult.getOrDefault("chunks", Collections.emptyList());
            List<DocumentChunk> chunkEntities = new ArrayList<>();

            for (Map<String, Object> cData : chunksData) {
                chunkEntities.add(DocumentChunk.builder()
                        .documentId(doc.getId())
                        .chunkIndex((Integer) cData.get("chunk_index"))
                        .text((String) cData.get("text"))
                        .pageNumber((Integer) cData.get("page_number"))
                        .section((String) cData.get("section"))
                        .metadata(objectMapper.writeValueAsString(cData.getOrDefault("metadata", Collections.emptyMap())))
                        .build());
            }
            documentChunkRepository.saveAll(chunkEntities);

            // Stage 3: Embedding & Vector Storage (80%)
            updateJobStage(job, "EMBEDDING", 80, "Generating embeddings and indexing into vector store");
            doc.setStatus("EMBEDDING");
            documentRepository.save(doc);

            Map<String, Object> embedRequest = new HashMap<>();
            embedRequest.put("document_id", doc.getId().toString());
            embedRequest.put("chunks", chunksData);
            aiServiceClient.embedChunks(embedRequest);

            // Stage 4: Completed (100%)
            updateJobStage(job, "COMPLETED", 100, "Document intelligence indexing complete");
            job.setCompletedAt(LocalDateTime.now());
            processingJobRepository.save(job);

            doc.setStatus("COMPLETED");
            doc.setProcessedAt(LocalDateTime.now());
            documentRepository.save(doc);

        } catch (Exception e) {
            String remedy = "Try uploading a text-based PDF or original DOCX. If file contains scanned pages, verify clarity.";
            job.setStatus("FAILED");
            job.setProgressPercent(100);
            job.setCurrentStageDescription("Processing failed");
            job.setErrorMessage(e.getMessage());
            job.setDiagnosticRemedy(remedy);
            job.setCompletedAt(LocalDateTime.now());
            processingJobRepository.save(job);

            doc.setStatus("FAILED");
            documentRepository.save(doc);
        }
        return CompletableFuture.completedFuture(null);
    }

    private void updateJobStage(ProcessingJob job, String status, int percent, String description) {
        job.setStatus(status);
        job.setProgressPercent(percent);
        job.setCurrentStageDescription(description);
        processingJobRepository.save(job);
    }
}
