package com.renalCareAI.renalCareAI.dto.response;

import java.time.Instant;

public record AdminChatLogItemResponse(
        Long id,
        Long userId,
        String userEmail,
        String userName,
        String userMessage,
        String assistantAnswer,
        String sourcesJson,
        String riskAssessment,
        Instant createdAt
) {
}
