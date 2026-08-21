package com.renalCareAI.renalCareAI.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import com.renalCareAI.renalCareAI.service.KidneyRiskScoringService;
import com.renalCareAI.renalCareAI.service.MedicalRecordAnalysisService;
import com.renalCareAI.renalCareAI.service.OpenAiMedicalOcrService;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

@Service
public class MedicalRecordAnalysisServiceImpl implements MedicalRecordAnalysisService {
    private static final int MAX_TEXT_LENGTH = 60_000;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OpenAiMedicalOcrService openAiMedicalOcrService;
    private final KidneyRiskScoringService kidneyRiskScoringService;

    public MedicalRecordAnalysisServiceImpl(
            OpenAiMedicalOcrService openAiMedicalOcrService,
            KidneyRiskScoringService kidneyRiskScoringService
    ) {
        this.openAiMedicalOcrService = openAiMedicalOcrService;
        this.kidneyRiskScoringService = kidneyRiskScoringService;
    }

    @Override
    public AnalysisResult analyze(Path filePath, String originalFileName, String contentType) throws IOException {
        String localText = extractText(filePath, originalFileName, contentType);
        String extractedText = localText;
        Map<String, Double> indicators = extractIndicators(extractedText);
        boolean aiOcrUsed = false;
        String aiOcrRawJson = "";

        if (shouldUseAiOcr(extractedText, indicators, originalFileName, contentType)) {
            try {
                OpenAiMedicalOcrService.OcrResult ocrResult = openAiMedicalOcrService.extract(filePath, originalFileName, contentType);
                aiOcrUsed = true;
                aiOcrRawJson = ocrResult.rawJson();
                extractedText = mergeText(localText, ocrResult.extractedText());
                indicators = mergeIndicators(indicators, ocrResult.indicators());
                indicators = mergeIndicators(indicators, extractIndicators(extractedText));
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                aiOcrRawJson = "{\"error\":\"OpenAI OCR interrupted\"}";
            } catch (IOException exception) {
                aiOcrRawJson = "{\"error\":\"OpenAI OCR failed\"}";
            }
        }

        KidneyRiskPredictionResponse prediction = kidneyRiskScoringService.predict(indicators, extractedText);

        Map<String, Object> extractedData = new LinkedHashMap<>();
        extractedData.put("fileName", originalFileName);
        extractedData.put("contentType", contentType);
        extractedData.put("extractionMode", aiOcrUsed
                ? extractionMode(originalFileName, contentType) + "+openai-ocr"
                : extractionMode(originalFileName, contentType));
        extractedData.put("aiOcrUsed", aiOcrUsed);
        if (!aiOcrRawJson.isBlank()) {
            extractedData.put("aiOcrRawJson", truncate(aiOcrRawJson));
        }
        extractedData.put("textPreview", preview(extractedText));
        extractedData.put("indicators", indicators);

        return new AnalysisResult(
                objectMapper.writeValueAsString(extractedData),
                objectMapper.writeValueAsString(prediction),
                prediction
        );
    }

    private String extractText(Path filePath, String originalFileName, String contentType) throws IOException {
        if (isPdf(originalFileName, contentType)) {
            try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
                return truncate(new PDFTextStripper().getText(document));
            }
        }

        if (isReadableText(originalFileName, contentType)) {
            return truncate(Files.readString(filePath, StandardCharsets.UTF_8));
        }

        return "";
    }

    private Map<String, Double> extractIndicators(String text) {
        Map<String, Double> indicators = new LinkedHashMap<>();
        putIfPresent(indicators, "age", findNumber(text, "(?:tuổi|age)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "eGFR", findNumber(text, "(?:egfr|e-gfr|gfr|ml/phút|ml/min)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "creatinine", findNumber(text, "(?:creatinine|creatinin)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "uACR", findNumber(text, "(?:uacr|acr|albumin.?creatinine)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "urineAlbumin", findNumber(text, "(?:albumin|protein|đạm)[^\\n\\r]{0,20}(?:niệu|urine|nước tiểu)?[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "hemoglobin", findNumber(text, "(?:hemoglobin|hgb|hb)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "glucose", findNumber(text, "(?:glucose|đường huyết|blood sugar)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "bloodUrea", findNumber(text, "(?:blood urea|bun|urea|ure|urê)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "sodium", findNumber(text, "(?:sodium|natri|na\\+?)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "potassium", findNumber(text, "(?:potassium|kali|k\\+?)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "serumAlbumin", findNumber(text, "(?:serum albumin|albumin máu|albumin huyết thanh)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "phosphorus", findNumber(text, "(?:phosphorus|phosphorous|phosphate|phosphat|phốt pho)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "bicarbonate", findNumber(text, "(?:bicarbonate|hco3)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "calcium", findNumber(text, "(?:calcium|canxi|ca\\+?\\+?)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "specificGravity", findNumber(text, "(?:specific gravity|tỷ trọng|ty trong|sg)[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putIfPresent(indicators, "urineSugar", findNumber(text, "(?:sugar|glucose|đường)[^\\n\\r]{0,20}(?:niệu|urine|nước tiểu)?[^0-9]{0,18}(\\d+(?:[\\.,]\\d+)?)"));
        putBloodPressure(indicators, text);
        return indicators;
    }

    private void putBloodPressure(Map<String, Double> indicators, String text) {
        Matcher matcher = Pattern.compile("(?:huyết áp|blood pressure|bp)[^0-9]{0,18}(\\d{2,3})\\s*/\\s*(\\d{2,3})", Pattern.CASE_INSENSITIVE)
                .matcher(text);
        if (matcher.find()) {
            indicators.put("systolicBloodPressure", Double.parseDouble(matcher.group(1)));
            indicators.put("diastolicBloodPressure", Double.parseDouble(matcher.group(2)));
        }
    }

    private Double findNumber(String text, String regex) {
        Matcher matcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return Double.parseDouble(matcher.group(1).replace(',', '.'));
    }

    private void putIfPresent(Map<String, Double> indicators, String key, Double value) {
        if (value != null) {
            indicators.put(key, value);
        }
    }

    private boolean isPdf(String fileName, String contentType) {
        return hasExtension(fileName, ".pdf") || "application/pdf".equalsIgnoreCase(contentType);
    }

    private boolean isReadableText(String fileName, String contentType) {
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        return lowerName.endsWith(".txt")
                || lowerName.endsWith(".csv")
                || lowerName.endsWith(".json")
                || lowerName.endsWith(".md")
                || (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("text/"));
    }

    private boolean shouldUseAiOcr(String extractedText, Map<String, Double> indicators, String fileName, String contentType) {
        return isImage(fileName, contentType)
                || (!isReadableText(fileName, contentType) && !isPdf(fileName, contentType))
                || extractedText.isBlank()
                || indicators.isEmpty();
    }

    private boolean isImage(String fileName, String contentType) {
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return true;
        }
        String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        return lowerName.endsWith(".png")
                || lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".webp");
    }

    private Map<String, Double> mergeIndicators(Map<String, Double> primary, Map<String, Double> secondary) {
        Map<String, Double> merged = new LinkedHashMap<>(primary);
        secondary.forEach(merged::putIfAbsent);
        return merged;
    }

    private String mergeText(String localText, String aiText) {
        if (aiText == null || aiText.isBlank()) {
            return localText;
        }
        if (localText == null || localText.isBlank()) {
            return truncate(aiText);
        }
        return truncate(localText + "\n\n--- OpenAI OCR ---\n" + aiText);
    }

    private boolean hasExtension(String fileName, String extension) {
        return fileName != null && fileName.toLowerCase(Locale.ROOT).endsWith(extension);
    }

    private String extractionMode(String fileName, String contentType) {
        if (isPdf(fileName, contentType)) {
            return "pdf-text";
        }
        if (isReadableText(fileName, contentType)) {
            return "plain-text";
        }
        return "stored-only";
    }

    private String preview(String text) {
        return truncate(text).substring(0, Math.min(1200, text.length()));
    }

    private String truncate(String text) {
        if (text == null) {
            return "";
        }
        return text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;
    }
}
