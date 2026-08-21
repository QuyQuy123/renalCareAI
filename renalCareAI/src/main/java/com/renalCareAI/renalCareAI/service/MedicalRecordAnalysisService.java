package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import java.io.IOException;
import java.nio.file.Path;

public interface MedicalRecordAnalysisService {
    AnalysisResult analyze(Path filePath, String originalFileName, String contentType) throws IOException;

    record AnalysisResult(
            String extractedDataJson,
            String predictionResultJson,
            KidneyRiskPredictionResponse prediction
    ) {
    }
}
