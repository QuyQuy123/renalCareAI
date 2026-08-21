package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.request.ChatRequest;
import com.renalCareAI.renalCareAI.dto.response.ChatResponse;

public interface RagChatClient {
    ChatResponse ask(ChatRequest request);
}
