package com.renalCareAI.renalCareAI.controller;

import com.renalCareAI.renalCareAI.dto.request.ChatRequest;
import com.renalCareAI.renalCareAI.dto.response.ChatResponse;
import com.renalCareAI.renalCareAI.service.RagChatClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final RagChatClient ragChatClient;
    private final com.renalCareAI.renalCareAI.service.AnalyticsTrackerService analyticsTrackerService;

    public ChatController(
            RagChatClient ragChatClient,
            com.renalCareAI.renalCareAI.service.AnalyticsTrackerService analyticsTrackerService
    ) {
        this.ragChatClient = ragChatClient;
        this.analyticsTrackerService = analyticsTrackerService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> ask(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = ragChatClient.ask(request);
        analyticsTrackerService.logChatMessage(request, response);
        return ResponseEntity.ok(response);
    }
}
