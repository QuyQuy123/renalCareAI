package com.renalCareAI.renalCareAI.service.impl;

import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import com.renalCareAI.renalCareAI.service.KidneyRiskScoringService;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class KidneyRiskScoringServiceImpl implements KidneyRiskScoringService {
    @Override
    public KidneyRiskPredictionResponse predict(Map<String, Double> rawIndicators, String extractedText) {
        Map<String, Double> indicators = new LinkedHashMap<>(rawIndicators);
        List<String> findings = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> limitations = new ArrayList<>();
        int score = 0;

        Double egfr = indicators.get("eGFR");
        if (egfr != null) {
            if (egfr < 15) {
                score += 45;
                findings.add("eGFR dưới 15 ml/phút/1,73m²: mức giảm chức năng thận rất nặng.");
            } else if (egfr < 30) {
                score += 35;
                findings.add("eGFR 15-29 ml/phút/1,73m²: giảm chức năng thận nặng.");
            } else if (egfr < 45) {
                score += 25;
                findings.add("eGFR 30-44 ml/phút/1,73m²: giảm chức năng thận mức trung bình-nặng.");
            } else if (egfr < 60) {
                score += 15;
                findings.add("eGFR 45-59 ml/phút/1,73m²: cần theo dõi bệnh thận mạn nếu kéo dài trên 3 tháng.");
            } else if (egfr < 90) {
                score += 5;
                findings.add("eGFR 60-89 ml/phút/1,73m²: cần diễn giải cùng tuổi, nước tiểu và bệnh nền.");
            }
        }

        Double uacr = indicators.get("uACR");
        if (uacr != null) {
            if (uacr >= 300) {
                score += 30;
                findings.add("uACR từ 300 mg/g trở lên: albumin niệu mức cao.");
            } else if (uacr >= 30) {
                score += 15;
                findings.add("uACR 30-299 mg/g: albumin niệu tăng, cần theo dõi tổn thương thận.");
            } else if (uacr <= 0) {
                limitations.add("uACR phải lớn hơn 0 để dùng cho ước tính KFRE.");
            }
        }

        addCommonCkdSignals(indicators, extractedText, findings);
        score += scoreCommonCkdSignals(indicators, extractedText);
        score += addKfreRiskIfPossible(indicators, extractedText, findings, limitations);

        int confidence = confidence(indicators, extractedText);
        String riskLevel = riskLevel(score, confidence);
        if (findings.isEmpty()) {
            findings.add("Chưa trích xuất được chỉ số thận rõ ràng từ hồ sơ.");
        }

        recommendations.add("Đối chiếu kết quả với bác sĩ, đặc biệt nếu eGFR dưới 60, uACR từ 30 mg/g, creatinine tăng hoặc có tiểu máu/đạm niệu.");
        recommendations.add("Theo dõi huyết áp, đường huyết, uống thuốc đúng chỉ định và không tự ý dùng thuốc giảm đau NSAID kéo dài.");
        recommendations.add("Nếu phù nhiều, khó thở, đau ngực, lú lẫn, tiểu máu nhiều hoặc huyết áp rất cao, cần đi khám/cấp cứu ngay.");

        if (extractedText.isBlank()) {
            limitations.add("Chưa đọc được nội dung từ file. Nếu là ảnh/PDF scan, hãy kiểm tra OPENAI_API_KEY và chất lượng file.");
        }
        if (indicators.isEmpty()) {
            limitations.add("Không đủ chỉ số định lượng để ước tính nguy cơ chính xác; vui lòng tải PDF/text rõ chữ hoặc nhập các chỉ số eGFR, creatinine, uACR.");
        }
        limitations.add("Kết quả chỉ là sàng lọc tham khảo, không phải chẩn đoán hoặc chỉ định điều trị.");

        String summary = switch (riskLevel) {
            case "HIGH" -> "Nguy cơ bệnh thận đang ở mức cao theo các chỉ số trích xuất được. Bạn nên đặt lịch khám chuyên khoa thận hoặc trao đổi sớm với bác sĩ.";
            case "MODERATE" -> "Có một số dấu hiệu cần theo dõi về sức khỏe thận. Bạn nên kiểm tra lại và trao đổi với bác sĩ.";
            case "LOW" -> "Chưa thấy dấu hiệu nguy cơ cao từ các chỉ số đọc được, nhưng vẫn nên theo dõi định kỳ nếu có bệnh nền.";
            default -> "Chưa đủ dữ liệu để dự đoán nguy cơ bệnh thận từ file này.";
        };

        return new KidneyRiskPredictionResponse(
                riskLevel,
                Math.min(score, 100),
                confidence,
                summary,
                indicators,
                findings,
                recommendations,
                limitations
        );
    }

    private void addCommonCkdSignals(Map<String, Double> indicators, String extractedText, List<String> findings) {
        Double creatinine = indicators.get("creatinine");
        if (creatinine != null && creatinine > 1.3) {
            findings.add("Creatinine máu tăng so với ngưỡng tham khảo thường dùng.");
        }

        Double albuminUrine = indicators.get("urineAlbumin");
        if (albuminUrine != null && albuminUrine > 0) {
            findings.add("Có dấu hiệu albumin/đạm niệu trong nước tiểu.");
        }

        Double systolic = indicators.get("systolicBloodPressure");
        if (systolic != null && systolic >= 140) {
            findings.add("Huyết áp tâm thu cao, đây là yếu tố nguy cơ quan trọng của bệnh thận.");
        }

        Double hemoglobin = indicators.get("hemoglobin");
        if (hemoglobin != null && hemoglobin < 11) {
            findings.add("Hemoglobin thấp; thiếu máu có thể gặp trong bệnh thận mạn nhưng cần bác sĩ đánh giá.");
        }

        Double bloodUrea = indicators.get("bloodUrea");
        if (bloodUrea != null && bloodUrea > 50) {
            findings.add("Ure/BUN tăng, cần diễn giải cùng creatinine, eGFR và tình trạng mất nước hoặc thuốc đang dùng.");
        }

        Double potassium = indicators.get("potassium");
        if (potassium != null && potassium >= 5.5) {
            findings.add("Kali máu cao có thể nguy hiểm, đặc biệt ở người bệnh thận hoặc đang dùng thuốc ảnh hưởng kali.");
        }

        Double specificGravity = indicators.get("specificGravity");
        if (specificGravity != null && specificGravity < 1.010) {
            findings.add("Tỷ trọng nước tiểu thấp có thể gợi ý khả năng cô đặc nước tiểu giảm, cần xét nghiệm lại nếu kéo dài.");
        }

        if (containsAny(extractedText, "diabetes", "tiểu đường", "đái tháo đường")) {
            findings.add("Có nhắc tới tiểu đường/đái tháo đường, là yếu tố nguy cơ bệnh thận.");
        }
        if (containsAny(extractedText, "hypertension", "tăng huyết áp", "cao huyết áp")) {
            findings.add("Có nhắc tới tăng huyết áp, là yếu tố nguy cơ bệnh thận.");
        }
        if (containsAny(extractedText, "pedal edema", "phù chân", "phù")) {
            findings.add("Có nhắc tới phù, một dấu hiệu cần được bác sĩ đánh giá trong bối cảnh bệnh thận.");
        }
    }

    private int scoreCommonCkdSignals(Map<String, Double> indicators, String extractedText) {
        int score = 0;
        Double creatinine = indicators.get("creatinine");
        if (creatinine != null && creatinine > 1.3) {
            score += creatinine >= 2.0 ? 20 : 10;
        }
        Double albuminUrine = indicators.get("urineAlbumin");
        if (albuminUrine != null && albuminUrine > 0) {
            score += albuminUrine >= 2 ? 15 : 8;
        }
        Double systolic = indicators.get("systolicBloodPressure");
        if (systolic != null && systolic >= 140) {
            score += systolic >= 160 ? 15 : 8;
        }
        Double hemoglobin = indicators.get("hemoglobin");
        if (hemoglobin != null && hemoglobin < 11) {
            score += 6;
        }
        Double bloodUrea = indicators.get("bloodUrea");
        if (bloodUrea != null && bloodUrea > 50) {
            score += bloodUrea >= 100 ? 12 : 6;
        }
        Double potassium = indicators.get("potassium");
        if (potassium != null && potassium >= 5.5) {
            score += 10;
        }
        Double specificGravity = indicators.get("specificGravity");
        if (specificGravity != null && specificGravity < 1.010) {
            score += 5;
        }
        if (containsAny(extractedText, "diabetes", "tiểu đường", "đái tháo đường")) {
            score += 8;
        }
        if (containsAny(extractedText, "hypertension", "tăng huyết áp", "cao huyết áp")) {
            score += 8;
        }
        return score;
    }

    private int addKfreRiskIfPossible(
            Map<String, Double> indicators,
            String extractedText,
            List<String> findings,
            List<String> limitations
    ) {
        Double age = indicators.get("age");
        Double egfr = indicators.get("eGFR");
        Double uacr = indicators.get("uACR");
        Boolean isMale = resolveIsMale(extractedText);

        if (age == null || egfr == null || uacr == null || isMale == null || uacr <= 0) {
            limitations.add("Chưa đủ tuổi, giới tính, eGFR và uACR hợp lệ để tính KFRE 2 năm/5 năm.");
            return 0;
        }

        double risk2Year = kfre4Variable(age, isMale, egfr, uacr, false, 2);
        double risk5Year = kfre4Variable(age, isMale, egfr, uacr, false, 5);
        indicators.put("kfre2YearPercent", roundPercent(risk2Year));
        indicators.put("kfre5YearPercent", roundPercent(risk5Year));
        findings.add("KFRE 4 biến ước tính nguy cơ suy thận khoảng "
                + roundPercent(risk2Year) + "% trong 2 năm và "
                + roundPercent(risk5Year) + "% trong 5 năm nếu dữ liệu đầu vào chính xác.");

        if (age < 18 || age > 100 || egfr > 60) {
            limitations.add("KFRE phù hợp nhất cho người trưởng thành có bệnh thận mạn giai đoạn G3-G5; kết quả ngoài phạm vi này cần thận trọng.");
        }

        if (risk5Year >= 0.20) {
            return 30;
        }
        if (risk5Year >= 0.10) {
            return 20;
        }
        if (risk5Year >= 0.05) {
            return 10;
        }
        return 0;
    }

    private double kfre4Variable(double age, boolean isMale, double egfr, double uacr, boolean isNorthAmerican, int years) {
        double alpha = isNorthAmerican
                ? (years == 2 ? 0.9750 : 0.9240)
                : (years == 2 ? 0.9832 : 0.9365);
        double sex = isMale ? 1.0 : 0.0;
        double riskScore =
                -0.2201 * (age / 10.0 - 7.036)
                        + 0.2467 * (sex - 0.5642)
                        - 0.5567 * (egfr / 5.0 - 7.222)
                        + 0.4510 * (Math.log(uacr) - 5.137);
        return 1 - Math.pow(alpha, Math.exp(riskScore));
    }

    private Boolean resolveIsMale(String text) {
        String normalized = text.toLowerCase(Locale.ROOT);
        if (containsAny(normalized, "nữ", "nu", "female", "giới tính: f", "sex: f")) {
            return false;
        }
        if (containsAny(normalized, "nam", "male", "giới tính: m", "sex: m")) {
            return true;
        }
        return null;
    }

    private int confidence(Map<String, Double> indicators, String extractedText) {
        if (extractedText.isBlank()) {
            return 10;
        }
        int confidence = Math.min(80, 25 + indicators.size() * 8);
        if (indicators.containsKey("eGFR")) {
            confidence += 10;
        }
        if (indicators.containsKey("uACR")) {
            confidence += 10;
        }
        if (indicators.containsKey("kfre2YearPercent")) {
            confidence += 10;
        }
        return Math.min(confidence, 95);
    }

    private String riskLevel(int score, int confidence) {
        if (confidence < 30) {
            return "INSUFFICIENT_DATA";
        }
        if (score >= 45) {
            return "HIGH";
        }
        if (score >= 20) {
            return "MODERATE";
        }
        return "LOW";
    }

    private double roundPercent(double value) {
        return Math.round(value * 10_000.0) / 100.0;
    }

    private boolean containsAny(String text, String... terms) {
        String normalized = text.toLowerCase(Locale.ROOT);
        for (String term : terms) {
            if (normalized.contains(term)) {
                return true;
            }
        }
        return false;
    }
}
