package com.renalCareAI.renalCareAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChatHistoryItem(
        @NotBlank
        @Pattern(regexp = "user|assistant")
        String role,

        @NotBlank
        @Size(max = 4000)
        String content
) {
}
