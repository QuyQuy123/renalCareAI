package com.renalCareAI.renalCareAI.service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

public interface OpenAiMedicalOcrService {
    OcrResult extract(Path filePath, String originalFileName, String contentType) throws IOException, InterruptedException;

    record OcrResult(
            String extractedText,
            Map<String, Double> indicators,
            String rawJson
    ) {
    }
}
