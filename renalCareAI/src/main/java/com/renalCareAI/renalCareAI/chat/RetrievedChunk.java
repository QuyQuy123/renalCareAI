package com.renalCareAI.renalCareAI.chat;

public record RetrievedChunk(
        String title,
        String url,
        double score,
        String snippet
) {
}
