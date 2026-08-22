package com.renalCareAI.renalCareAI.dto.response;

import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.model.UserRole;
import java.time.Instant;
import java.time.LocalDate;

public record AdminUserListItemResponse(
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
        int medicalRecordCount,
        String primaryRiskLevel, // "HIGH", "MODERATE", "LOW", "INSUFFICIENT_DATA", "NONE"
        Integer highestRiskScore,
        Instant createdAt,
        Instant lastActiveAt
) {
}
