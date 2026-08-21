package com.renalCareAI.renalCareAI.chat;

import com.renalCareAI.renalCareAI.rag.RagProcessProperties;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import reactor.core.publisher.Mono;

@Service
public class RagChatClient {
    private static final Logger log = LoggerFactory.getLogger(RagChatClient.class);

    private final WebClient webClient;

    public RagChatClient(RagProcessProperties properties) {
        this.webClient = WebClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    public ChatResponse ask(ChatRequest request) {
        try {
            return webClient.post()
                    .uri("/api/chat")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("RAG service error")
                            .flatMap(body -> Mono.error(new RagServiceException(formatRagError(response.statusCode(), body)))))
                    .bodyToMono(ChatResponse.class)
                    .block(Duration.ofSeconds(60));
        } catch (WebClientRequestException exception) {
            throw new RagServiceException("Không kết nối được RAG service tại 127.0.0.1:8001. Hãy kiểm tra Python process đã chạy chưa.");
        }
    }

    private String formatRagError(HttpStatusCode statusCode, String body) {
        log.warn("RAG service returned {} with body: {}", statusCode.value(), body);
        return "RAG service returned " + statusCode.value() + ": " + extractErrorMessage(body);
    }

    private String extractErrorMessage(String body) {
        String detailKey = "\"detail\":\"";
        int detailStart = body.indexOf(detailKey);
        if (detailStart >= 0) {
            int valueStart = detailStart + detailKey.length();
            int valueEnd = body.indexOf('"', valueStart);
            if (valueEnd > valueStart) {
                return body.substring(valueStart, valueEnd).replace("\\n", "\n").replace("\\\"", "\"");
            }
        }
        String messageKey = "\"message\":\"";
        int messageStart = body.indexOf(messageKey);
        if (messageStart >= 0) {
            int valueStart = messageStart + messageKey.length();
            int valueEnd = body.indexOf('"', valueStart);
            if (valueEnd > valueStart) {
                return body.substring(valueStart, valueEnd).replace("\\n", "\n").replace("\\\"", "\"");
            }
        }
        return body;
    }
}
