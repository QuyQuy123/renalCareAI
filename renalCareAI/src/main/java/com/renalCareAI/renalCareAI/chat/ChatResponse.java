package com.renalCareAI.renalCareAI.chat;

import java.util.List;

public record ChatResponse(
        String answer,
        List<ChatSource> sources,
        List<RetrievedChunk> retrieved
) {
}
