package com.intellidoc.controller;

import com.intellidoc.dto.DashboardStatsDto;
import com.intellidoc.entity.User;
import com.intellidoc.service.AuthService;
import com.intellidoc.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AuthService authService;

    private Long getUserId(UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return user.getId();
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(dashboardService.getDashboardStats(userId));
    }
}
