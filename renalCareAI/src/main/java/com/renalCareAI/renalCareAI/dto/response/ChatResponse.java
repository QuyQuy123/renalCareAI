package com.renalCareAI.renalCareAI.dto.response;

import java.util.List;

public record ChatResponse(
        String answer,
        List<ChatSource> sources,
        List<RetrievedChunk> retrieved
) {
}
