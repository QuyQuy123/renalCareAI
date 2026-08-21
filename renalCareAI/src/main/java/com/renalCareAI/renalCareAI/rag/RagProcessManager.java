package com.renalCareAI.renalCareAI.rag;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
public class RagProcessManager implements SmartLifecycle {
    private static final Logger log = LoggerFactory.getLogger(RagProcessManager.class);

    private final RagProcessProperties properties;
    private final ExecutorService logExecutor = Executors.newSingleThreadExecutor();
    private volatile Process process;
    private volatile boolean running;

    public RagProcessManager(RagProcessProperties properties) {
        this.properties = properties;
    }

    @Override
    public void start() {
        if (!properties.autostart()) {
            log.info("RAG autostart is disabled.");
            return;
        }
        Path workingDirectory = properties.workingDirectoryPath();
        if (!Files.isDirectory(workingDirectory)) {
            log.warn("RAG working directory does not exist: {}", workingDirectory.toAbsolutePath());
            return;
        }
        if (running) {
            return;
        }

        try {
            ProcessBuilder builder = new ProcessBuilder(properties.command());
            builder.directory(workingDirectory.toFile());
            builder.redirectErrorStream(true);
            process = builder.start();
            running = true;
            log.info("Started RAG service with command {} in {}", properties.command(), workingDirectory.toAbsolutePath());
            logExecutor.submit(this::streamLogs);
        } catch (IOException error) {
            running = false;
            log.warn("Could not start RAG service. Start it manually or check app.rag.command.", error);
        }
    }

    @Override
    public void stop() {
        running = false;
        Process currentProcess = process;
        if (currentProcess != null && currentProcess.isAlive()) {
            currentProcess.destroy();
            log.info("Stopped RAG service process.");
        }
        logExecutor.shutdownNow();
    }

    @Override
    public boolean isRunning() {
        return running && process != null && process.isAlive();
    }

    private void streamLogs() {
        Process currentProcess = process;
        if (currentProcess == null) {
            return;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(currentProcess.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.info("[rag] {}", line);
            }
        } catch (IOException error) {
            if (running) {
                log.debug("RAG log stream closed.", error);
            }
        } finally {
            running = false;
        }
    }
}
