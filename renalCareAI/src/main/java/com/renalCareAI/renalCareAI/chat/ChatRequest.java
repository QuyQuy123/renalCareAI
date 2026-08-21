package com.renalCareAI.renalCareAI.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChatRequest(
        @NotBlank
        @Size(min = 2, max = 2000)
        String message,

        List<@Valid ChatHistoryItem> history
) {
    public ChatRequest {
        history = history == null ? List.of() : List.copyOf(history);
    }
}
