package com.renalCareAI.renalCareAI.controller;

import com.renalCareAI.renalCareAI.dto.response.AdminDashboardStatsResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserDetailResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserListItemResponse;
import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.service.AdminService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserListItemResponse>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/users/{userId}/dossier")
    public ResponseEntity<AdminUserDetailResponse> getUserDossier(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId));
    }

    @GetMapping("/chat-logs")
    public ResponseEntity<com.renalCareAI.renalCareAI.dto.response.AdminChatLogPageResponse> getChatLogs(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "1") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(adminService.getChatLogs(page, size, keyword));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload
    ) {
        String statusStr = payload.get("status");
        if (statusStr != null) {
            AccountStatus status = AccountStatus.valueOf(statusStr.toUpperCase());
            adminService.updateUserStatus(userId, status);
        }
        return ResponseEntity.noContent().build();
    }
}
