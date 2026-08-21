package com.renalCareAI.renalCareAI.rag;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rag")
public record RagProcessProperties(
        boolean autostart,
        String workingDirectory,
        List<String> command,
        String baseUrl,
        Duration startupTimeout
) {
    public RagProcessProperties {
        if (workingDirectory == null || workingDirectory.isBlank()) {
            workingDirectory = "../chatbox-rag";
        }
        if (command == null || command.isEmpty()) {
            command = List.of("python", "-m", "app.start");
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://127.0.0.1:8001";
        }
        if (startupTimeout == null) {
            startupTimeout = Duration.ofSeconds(25);
        }
    }

    public Path workingDirectoryPath() {
        return Path.of(workingDirectory).normalize();
    }
}
