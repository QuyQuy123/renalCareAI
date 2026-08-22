package com.renalCareAI.renalCareAI.dto.response;

import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.model.UserRole;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record AdminUserDetailResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String healthNote,
        UserRole role,
        AccountStatus status,
        Instant createdAt,
        Instant updatedAt,
        String aggregateRiskLevel,
        Integer aggregateRiskScore,
        String aggregateSummary,
        Map<String, Double> latestClinicalIndicators,
        List<String> clinicalFindings,
        List<String> recommendations,
        List<MedicalRecordResponse> medicalRecords,
        List<AdminChatLogItemResponse> chatLogs
) {
}
