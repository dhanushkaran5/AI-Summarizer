package com.intellidoc.service;

import com.intellidoc.dto.VerificationDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.DocumentChunk;
import com.intellidoc.repository.DocumentChunkRepository;
import com.intellidoc.repository.DocumentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class VerificationServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private AIServiceClient aiServiceClient;

    @InjectMocks
    private VerificationService verificationService;

    @Test
    public void testVerifyClaims() {
        Long docId = 1L;
        Long userId = 42L;

        Document doc = Document.builder()
                .id(docId)
                .userId(userId)
                .originalName("whitepaper.pdf")
                .build();

        DocumentChunk chunk = DocumentChunk.builder()
                .id(10L)
                .documentId(docId)
                .chunkIndex(0)
                .pageNumber(1)
                .section("Introduction")
                .text("IntelliDoc AI provides genuine grounded RAG with verifiable claims.")
                .build();

        when(documentRepository.findByIdAndUserId(docId, userId)).thenReturn(Optional.of(doc));
        when(documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(docId)).thenReturn(List.of(chunk));

        Map<String, Object> aiRes = new HashMap<>();
        aiRes.put("status", "supported");
        aiRes.put("claim_status", "EXPLICITLY STATED");
        aiRes.put("confidence", 0.95);
        aiRes.put("details", "All claims matched.");
        aiRes.put("claims", List.of(Map.of(
                "claim", "IntelliDoc provides genuine grounded RAG",
                "status", "SUPPORTED",
                "confidence", 0.96,
                "evidence_quote", "IntelliDoc AI provides genuine grounded RAG with verifiable claims."
        )));
        aiRes.put("mock", false);

        when(aiServiceClient.verifyClaims(any())).thenReturn(aiRes);

        VerificationDto.VerifyRequest request = VerificationDto.VerifyRequest.builder()
                .text("IntelliDoc provides genuine grounded RAG")
                .claims(List.of("IntelliDoc provides genuine grounded RAG"))
                .build();

        VerificationDto.VerifyResponse response = verificationService.verifyClaims(docId, userId, request);

        assertNotNull(response);
        assertEquals("supported", response.getStatus());
        assertEquals("EXPLICITLY STATED", response.getClaimStatus());
        assertEquals(1, response.getClaims().size());
        assertEquals("SUPPORTED", response.getClaims().get(0).getStatus());
        assertEquals(1, response.getSources().size());
    }
}
