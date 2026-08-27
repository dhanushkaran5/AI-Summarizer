package com.intellidoc.controller;

import com.intellidoc.dto.ContradictionDto;
import com.intellidoc.dto.DocumentIntelligenceResponse;
import com.intellidoc.dto.KnowledgeMapDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(@RequestParam("file") MultipartFile file,
                                                              @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        Long userId = getUserId(userDetails);
        Map<String, Object> result = documentService.uploadAndStartProcessing(file, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getAllUserDocuments(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getDocumentById(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        documentService.deleteDocument(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<Document> getDocumentStatus(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getDocumentById(id, userId));
    }

    @GetMapping("/{id}/intelligence")
    public ResponseEntity<DocumentIntelligenceResponse> getIntelligence(@PathVariable Long id,
                                                                         @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getIntelligence(id, userId));
    }

    @GetMapping("/{id}/contradictions")
    public ResponseEntity<ContradictionDto.Response> getContradictions(@PathVariable Long id,
                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getContradictions(id, userId));
    }

    @GetMapping("/{id}/knowledge-map")
    public ResponseEntity<KnowledgeMapDto> getKnowledgeMap(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(documentService.getKnowledgeMap(id, userId));
    }
}
