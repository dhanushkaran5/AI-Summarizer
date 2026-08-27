package com.intellidoc.controller;

import com.intellidoc.dto.JobDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobDto> getJobStatus(@PathVariable String jobId,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(jobService.getJobStatus(jobId, userId));
    }
}
