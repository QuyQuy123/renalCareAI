package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import java.util.Map;

public interface KidneyRiskScoringService {
    KidneyRiskPredictionResponse predict(Map<String, Double> indicators, String extractedText);
}
