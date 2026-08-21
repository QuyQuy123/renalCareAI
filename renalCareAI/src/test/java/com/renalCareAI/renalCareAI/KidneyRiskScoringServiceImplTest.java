package com.renalCareAI.renalCareAI;

import static org.assertj.core.api.Assertions.assertThat;

import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import com.renalCareAI.renalCareAI.service.impl.KidneyRiskScoringServiceImpl;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class KidneyRiskScoringServiceImplTest {
    private final KidneyRiskScoringServiceImpl scoringService = new KidneyRiskScoringServiceImpl();

    @Test
    void predictsKfreWhenCoreInputsAreAvailable() {
        Map<String, Double> indicators = new LinkedHashMap<>();
        indicators.put("age", 57.28);
        indicators.put("eGFR", 15.0);
        indicators.put("uACR", 1762.00184);

        KidneyRiskPredictionResponse response = scoringService.predict(indicators, "Giới tính: Nữ");

        assertThat(response.indicators()).containsKeys("kfre2YearPercent", "kfre5YearPercent");
        assertThat(response.indicators().get("kfre2YearPercent")).isBetween(44.0, 45.5);
        assertThat(response.indicators().get("kfre5YearPercent")).isBetween(89.0, 91.0);
        assertThat(response.riskLevel()).isEqualTo("HIGH");
    }

    @Test
    void doesNotTreatFemaleAsMaleWhenCalculatingKfre() {
        Map<String, Double> indicators = new LinkedHashMap<>();
        indicators.put("age", 60.0);
        indicators.put("eGFR", 25.0);
        indicators.put("uACR", 200.0);

        KidneyRiskPredictionResponse female = scoringService.predict(indicators, "sex: female");
        KidneyRiskPredictionResponse male = scoringService.predict(indicators, "sex: male");

        assertThat(female.indicators().get("kfre5YearPercent"))
                .isLessThan(male.indicators().get("kfre5YearPercent"));
    }
}
