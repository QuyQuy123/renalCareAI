package com.renalCareAI.renalCareAI.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renalCareAI.renalCareAI.service.OpenAiMedicalOcrService;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenAiMedicalOcrServiceImpl implements OpenAiMedicalOcrService {
    private static final String RESPONSES_URL = "https://api.openai.com/v1/responses";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
    private final String apiKey;
    private final String model;

    public OpenAiMedicalOcrServiceImpl(
            @Value("${app.openai.api-key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${app.openai.ocr-model:${OPENAI_OCR_MODEL:gpt-5-mini}}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public OcrResult extract(Path filePath, String originalFileName, String contentType) throws IOException, InterruptedException {
        if (apiKey == null || apiKey.isBlank()) {
            return new OcrResult("", Map.of(), "{\"error\":\"Missing OPENAI_API_KEY\"}");
        }

        String mimeType = normalizeContentType(contentType, originalFileName);
        String dataUrl = "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(Files.readAllBytes(filePath));
        Map<String, Object> inputFile = contentItem(dataUrl, originalFileName, mimeType);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "input", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of(
                                        "type", "input_text",
                                        "text", prompt()
                                ),
                                inputFile
                        )
                ))
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESPONSES_URL))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return new OcrResult("", Map.of(), "{\"error\":\"OpenAI OCR failed with status " + response.statusCode() + "\"}");
        }

        String outputText = extractOutputText(response.body());
        Map<String, Object> parsed = parseJsonObject(outputText);
        String extractedText = stringValue(parsed.get("text"));
        Map<String, Double> indicators = parseIndicators(parsed.get("indicators"));

        return new OcrResult(extractedText, indicators, outputText);
    }

    private Map<String, Object> contentItem(String dataUrl, String fileName, String mimeType) {
        if (mimeType.startsWith("image/")) {
            return Map.of(
                    "type", "input_image",
                    "image_url", dataUrl,
                    "detail", "high"
            );
        }

        return Map.of(
                "type", "input_file",
                "filename", fileName,
                "file_data", dataUrl
        );
    }

    private String prompt() {
        return """
                Bạn là công cụ OCR và trích xuất chỉ số xét nghiệm cho RenalCareAI.
                Hãy đọc file hồ sơ khám bệnh thận hoặc xét nghiệm sức khỏe. Trả về DUY NHẤT JSON hợp lệ, không markdown.
                JSON schema:
                {
                  "text": "toàn bộ nội dung đọc được hoặc phần quan trọng",
                  "indicators": {
                    "eGFR": number|null,
                    "age": number|null,
                    "creatinine": number|null,
                    "uACR": number|null,
                    "urineAlbumin": number|null,
                    "hemoglobin": number|null,
                    "glucose": number|null,
                    "bloodUrea": number|null,
                    "sodium": number|null,
                    "potassium": number|null,
                    "serumAlbumin": number|null,
                    "phosphorus": number|null,
                    "bicarbonate": number|null,
                    "calcium": number|null,
                    "specificGravity": number|null,
                    "urineSugar": number|null,
                    "systolicBloodPressure": number|null,
                    "diastolicBloodPressure": number|null
                  }
                }
                Nếu thấy giới tính, hãy giữ nguyên trong trường "text" dưới dạng Nam/Nữ hoặc male/female.
                Chỉ điền số khi nhìn thấy rõ trong tài liệu. Không tự bịa chỉ số.
                """.strip();
    }

    private String extractOutputText(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode outputText = root.get("output_text");
        if (outputText != null && outputText.isTextual()) {
            return outputText.asText();
        }

        JsonNode output = root.get("output");
        if (output != null && output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.get("content");
                if (content == null || !content.isArray()) {
                    continue;
                }
                for (JsonNode contentItem : content) {
                    JsonNode text = contentItem.get("text");
                    if (text != null && text.isTextual()) {
                        return text.asText();
                    }
                }
            }
        }
        return "{}";
    }

    private Map<String, Object> parseJsonObject(String text) throws IOException {
        String json = text.trim();
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start >= 0 && end > start) {
            json = json.substring(start, end + 1);
        }
        return objectMapper.readValue(json, new TypeReference<>() {
        });
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> parseIndicators(Object value) {
        if (!(value instanceof Map<?, ?> source)) {
            return Map.of();
        }

        Map<String, Double> indicators = new LinkedHashMap<>();
        source.forEach((key, rawValue) -> {
            Double number = numberValue(rawValue);
            if (key != null && number != null) {
                indicators.put(String.valueOf(key), number);
            }
        });
        return indicators;
    }

    private Double numberValue(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Double.parseDouble(text.replace(',', '.'));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String normalizeContentType(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        if (lowerName.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lowerName.endsWith(".png")) {
            return "image/png";
        }
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lowerName.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }
}
