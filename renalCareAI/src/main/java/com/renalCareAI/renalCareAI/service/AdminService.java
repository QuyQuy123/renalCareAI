package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.response.AdminChatLogPageResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminDashboardStatsResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserDetailResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserListItemResponse;
import com.renalCareAI.renalCareAI.model.AccountStatus;
import java.util.List;

public interface AdminService {
    AdminDashboardStatsResponse getDashboardStats();

    List<AdminUserListItemResponse> listUsers();

    AdminUserDetailResponse getUserDetail(Long userId);

    AdminChatLogPageResponse getChatLogs(int page, int size, String keyword);

    void updateUserStatus(Long userId, AccountStatus status);
}
