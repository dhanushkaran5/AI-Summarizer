package com.intellidoc.controller;

import com.intellidoc.dto.StudyMaterialDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.StudyMaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
public class StudyController {

    @Autowired
    private StudyMaterialService studyMaterialService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @PostMapping("/{docId}/study-material")
    public ResponseEntity<StudyMaterialDto.StudyMaterialResponse> generateStudyMaterial(@PathVariable Long docId,
                                                                                          @RequestBody StudyMaterialDto.StudyMaterialRequest request,
                                                                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(studyMaterialService.generateStudyMaterial(docId, userId, request));
    }
}
