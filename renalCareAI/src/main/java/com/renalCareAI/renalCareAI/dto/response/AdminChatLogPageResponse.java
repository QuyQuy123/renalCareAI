package com.renalCareAI.renalCareAI.dto.response;

import java.util.List;

public record AdminChatLogPageResponse(
        List<AdminChatLogItemResponse> items,
        long totalItems,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
