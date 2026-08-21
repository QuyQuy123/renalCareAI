package com.renalCareAI.renalCareAI.dto.response;

import com.renalCareAI.renalCareAI.model.MedicalRecord;
import com.renalCareAI.renalCareAI.model.MedicalRecordStatus;
import java.time.Instant;

public record MedicalRecordResponse(
        Long id,
        String originalFileName,
        String contentType,
        long fileSize,
        MedicalRecordStatus status,
        String riskSummary,
        String extractedDataJson,
        String predictionResultJson,
        Instant uploadedAt
) {
    public static MedicalRecordResponse from(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getOriginalFileName(),
                record.getContentType(),
                record.getFileSize(),
                record.getStatus(),
                record.getRiskSummary(),
                record.getExtractedDataJson(),
                record.getPredictionResultJson(),
                record.getUploadedAt()
        );
    }
}
