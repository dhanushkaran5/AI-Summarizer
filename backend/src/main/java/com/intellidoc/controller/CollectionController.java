package com.intellidoc.controller;

import com.intellidoc.dto.ChatDto;
import com.intellidoc.dto.CollectionDto;
import com.intellidoc.entity.Document;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.CollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @PostMapping
    public ResponseEntity<CollectionDto.CollectionResponse> createCollection(@RequestBody CollectionDto.CreateCollectionRequest request,
                                                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.createCollection(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<CollectionDto.CollectionResponse>> getAllCollections(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.getAllCollections(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollectionDto.CollectionResponse> getCollectionById(@PathVariable Long id,
                                                                                @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.getCollectionById(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        collectionService.deleteCollection(id, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{collectionId}/documents")
    public ResponseEntity<Void> addDocumentToCollection(@PathVariable Long collectionId,
                                                         @RequestBody CollectionDto.AddDocumentRequest request,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        collectionService.addDocumentToCollection(collectionId, request.getDocumentId(), userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{collectionId}/documents/{documentId}")
    public ResponseEntity<Void> removeDocumentFromCollection(@PathVariable Long collectionId,
                                                              @PathVariable Long documentId,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        collectionService.removeDocumentFromCollection(collectionId, documentId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{collectionId}/documents")
    public ResponseEntity<List<Document>> getCollectionDocuments(@PathVariable Long collectionId,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.getCollectionDocuments(collectionId, userId));
    }

    @PostMapping("/{collectionId}/chat")
    public ResponseEntity<ChatDto.ChatResponse> chatWithCollection(@PathVariable Long collectionId,
                                                                   @RequestBody ChatDto.ChatRequest request,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.chatWithCollection(collectionId, userId, request));
    }

    @PostMapping("/{collectionId}/compare")
    public ResponseEntity<CollectionDto.CompareResponse> compareCollectionDocuments(@PathVariable Long collectionId,
                                                                                     @RequestBody CollectionDto.CompareRequest request,
                                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(collectionService.compareCollectionDocuments(collectionId, userId, request));
    }
}
