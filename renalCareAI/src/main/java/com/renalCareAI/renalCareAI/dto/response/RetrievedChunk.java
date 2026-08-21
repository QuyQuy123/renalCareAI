package com.renalCareAI.renalCareAI.dto.response;

public record RetrievedChunk(
        String title,
        String url,
        double score,
        String snippet
) {
}
