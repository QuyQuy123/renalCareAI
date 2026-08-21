package com.renalCareAI.renalCareAI.dto.response;

import java.util.List;
import java.util.Map;

public record KidneyRiskPredictionResponse(
        String riskLevel,
        int riskScore,
        int confidence,
        String summary,
        Map<String, Double> indicators,
        List<String> findings,
        List<String> recommendations,
        List<String> limitations
) {
}
