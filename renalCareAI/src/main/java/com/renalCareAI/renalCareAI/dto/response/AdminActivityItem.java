package com.renalCareAI.renalCareAI.dto.response;

import java.time.Instant;

public record AdminActivityItem(
        String id,
        String type, // "USER_REGISTERED", "MEDICAL_RECORD_UPLOADED", "CHAT_INTERACTION"
        String title,
        String description,
        String userEmail,
        String riskLevel,
        Instant timestamp
) {
}
