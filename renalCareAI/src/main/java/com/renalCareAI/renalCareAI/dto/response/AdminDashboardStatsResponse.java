package com.renalCareAI.renalCareAI.dto.response;

import java.util.List;
import java.util.Map;

public record AdminDashboardStatsResponse(
        long uniqueVisitors,
        long totalPageviews,
        long totalChatResponses,
        long totalMedicalRecords,
        long totalUsers,
        Map<String, Long> riskDistribution,
        List<AdminActivityItem> recentActivities
) {
}
