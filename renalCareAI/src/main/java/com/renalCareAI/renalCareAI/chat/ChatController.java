package com.renalCareAI.renalCareAI.chat;

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

    public ChatController(RagChatClient ragChatClient) {
        this.ragChatClient = ragChatClient;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> ask(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(ragChatClient.ask(request));
    }
}
