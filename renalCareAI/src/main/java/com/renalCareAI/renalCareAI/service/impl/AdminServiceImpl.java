package com.renalCareAI.renalCareAI.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renalCareAI.renalCareAI.dto.response.AdminActivityItem;
import com.renalCareAI.renalCareAI.dto.response.AdminChatLogItemResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminChatLogPageResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminDashboardStatsResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserDetailResponse;
import com.renalCareAI.renalCareAI.dto.response.AdminUserListItemResponse;
import com.renalCareAI.renalCareAI.dto.response.KidneyRiskPredictionResponse;
import com.renalCareAI.renalCareAI.dto.response.MedicalRecordResponse;
import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.model.ChatMessageLog;
import com.renalCareAI.renalCareAI.model.MedicalRecord;
import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.repository.ChatMessageLogRepository;
import com.renalCareAI.renalCareAI.repository.MedicalRecordRepository;
import com.renalCareAI.renalCareAI.repository.UserRepository;
import com.renalCareAI.renalCareAI.service.AdminService;
import com.renalCareAI.renalCareAI.service.AnalyticsTrackerService;
import com.renalCareAI.renalCareAI.service.KidneyRiskScoringService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ChatMessageLogRepository chatMessageLogRepository;
    private final AnalyticsTrackerService analyticsTrackerService;
    private final KidneyRiskScoringService kidneyRiskScoringService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AdminServiceImpl(
            UserRepository userRepository,
            MedicalRecordRepository medicalRecordRepository,
            ChatMessageLogRepository chatMessageLogRepository,
            AnalyticsTrackerService analyticsTrackerService,
            KidneyRiskScoringService kidneyRiskScoringService
    ) {
        this.userRepository = userRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.chatMessageLogRepository = chatMessageLogRepository;
        this.analyticsTrackerService = analyticsTrackerService;
        this.kidneyRiskScoringService = kidneyRiskScoringService;
    }

    @Transactional(readOnly = true)
    @Override
    public AdminDashboardStatsResponse getDashboardStats() {
        long uniqueVisitors = analyticsTrackerService.getUniqueVisitorsCount();
        long totalPageviews = analyticsTrackerService.getTotalPageviewsCount();
        long totalChatResponses = analyticsTrackerService.getTotalChatResponsesCount();
        long totalMedicalRecords = medicalRecordRepository.count();
        long totalUsers = userRepository.count();

        // Calculate risk distribution
        Map<String, Long> riskDistribution = new HashMap<>();
        riskDistribution.put("HIGH", 0L);
        riskDistribution.put("MODERATE", 0L);
        riskDistribution.put("LOW", 0L);
        riskDistribution.put("NONE", 0L);

        List<User> users = userRepository.findAll();
        List<AdminActivityItem> activities = new ArrayList<>();

        for (User user : users) {
            List<MedicalRecord> userRecords = medicalRecordRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
            String primaryRisk = resolvePrimaryRisk(userRecords);
            riskDistribution.put(primaryRisk, riskDistribution.getOrDefault(primaryRisk, 0L) + 1);

            // User registered activity
            activities.add(new AdminActivityItem(
                    "usr-" + user.getId(),
                    "USER_REGISTERED",
                    "Thành viên mới đăng ký",
                    "Người dùng " + user.getFullName() + " (" + user.getEmail() + ") đã tạo tài khoản.",
                    user.getEmail(),
                    primaryRisk,
                    user.getCreatedAt()
            ));

            // Record uploaded activity
            for (MedicalRecord record : userRecords) {
                String risk = "NONE";
                KidneyRiskPredictionResponse pred = parsePrediction(record.getPredictionResultJson());
                if (pred != null && pred.riskLevel() != null) {
                    risk = pred.riskLevel();
                }
                activities.add(new AdminActivityItem(
                        "rec-" + record.getId(),
                        "MEDICAL_RECORD_UPLOADED",
                        "Hồ sơ khám được tải lên",
                        "Người dùng " + user.getFullName() + " tải file: " + record.getOriginalFileName(),
                        user.getEmail(),
                        risk,
                        record.getUploadedAt()
                ));
            }
        }

        // Sort activities newest first, limit to top 100
        activities.sort(Comparator.comparing(AdminActivityItem::timestamp).reversed());
        List<AdminActivityItem> recentActivities = activities.stream().limit(100).toList();

        return new AdminDashboardStatsResponse(
                uniqueVisitors,
                totalPageviews,
                totalChatResponses,
                totalMedicalRecords,
                totalUsers,
                riskDistribution,
                recentActivities
        );
    }

    @Transactional(readOnly = true)
    @Override
    public List<AdminUserListItemResponse> listUsers() {
        List<User> users = userRepository.findAll();
        List<AdminUserListItemResponse> result = new ArrayList<>();

        for (User user : users) {
            List<MedicalRecord> records = medicalRecordRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
            String primaryRisk = resolvePrimaryRisk(records);
            Integer highestRiskScore = resolveHighestRiskScore(records);

            result.add(new AdminUserListItemResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhoneNumber(),
                    user.getDateOfBirth(),
                    user.getGender(),
                    user.getAddress(),
                    user.getHealthNote(),
                    user.getRole(),
                    user.getStatus(),
                    records.size(),
                    primaryRisk,
                    highestRiskScore,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            ));
        }

        result.sort(Comparator.comparing(AdminUserListItemResponse::createdAt).reversed());
        return result;
    }

    @Transactional(readOnly = true)
    @Override
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        List<MedicalRecord> records = medicalRecordRepository.findByUserIdOrderByUploadedAtDesc(userId);
        List<MedicalRecordResponse> recordResponses = records.stream()
                .map(MedicalRecordResponse::from)
                .toList();

        // Aggregate latest clinical indicators from user's records
        Map<String, Double> aggregateIndicators = new LinkedHashMap<>();
        for (MedicalRecord record : records) {
            Map<String, Double> recordIndicators = parseIndicators(record.getExtractedDataJson());
            recordIndicators.forEach(aggregateIndicators::putIfAbsent);
        }

        // Run holistic clinical risk evaluation for this user
        String aggregateText = (user.getHealthNote() != null ? user.getHealthNote() : "") + " "
                + (user.getGender() != null ? "Giới tính: " + user.getGender() : "");

        KidneyRiskPredictionResponse holisticPrediction = kidneyRiskScoringService.predict(aggregateIndicators, aggregateText);

        // Fetch chat logs for this user
        List<ChatMessageLog> userChatLogs = chatMessageLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (userChatLogs.isEmpty() && user.getEmail() != null) {
            userChatLogs = chatMessageLogRepository.findByUserEmailOrderByCreatedAtDesc(user.getEmail());
        }

        List<AdminChatLogItemResponse> chatLogResponses = userChatLogs.stream()
                .map(this::mapToChatLogItem)
                .toList();

        return new AdminUserDetailResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAddress(),
                user.getHealthNote(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                holisticPrediction.riskLevel(),
                holisticPrediction.riskScore(),
                holisticPrediction.summary(),
                aggregateIndicators,
                holisticPrediction.findings(),
                holisticPrediction.recommendations(),
                recordResponses,
                chatLogResponses
        );
    }

    @Transactional(readOnly = true)
    @Override
    public AdminChatLogPageResponse getChatLogs(int page, int size, String keyword) {
        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        Page<ChatMessageLog> pageResult;
        if (keyword != null && !keyword.isBlank()) {
            pageResult = chatMessageLogRepository.searchLogs(keyword.trim(), pageable);
        } else {
            pageResult = chatMessageLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<AdminChatLogItemResponse> items = pageResult.getContent().stream()
                .map(this::mapToChatLogItem)
                .toList();

        return new AdminChatLogPageResponse(
                items,
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                page,
                pageSize
        );
    }

    @Transactional
    @Override
    public void updateUserStatus(Long userId, AccountStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        user.setStatus(status);
        userRepository.save(user);
    }

    private AdminChatLogItemResponse mapToChatLogItem(ChatMessageLog log) {
        return new AdminChatLogItemResponse(
                log.getId(),
                log.getUserId(),
                log.getUserEmail(),
                log.getUserName(),
                log.getUserMessage(),
                log.getAssistantAnswer(),
                log.getSourcesJson(),
                log.getRiskAssessment(),
                log.getCreatedAt()
        );
    }

    private String resolvePrimaryRisk(List<MedicalRecord> records) {
        if (records.isEmpty()) {
            return "NONE";
        }
        boolean hasHigh = false;
        boolean hasModerate = false;
        boolean hasLow = false;

        for (MedicalRecord record : records) {
            KidneyRiskPredictionResponse pred = parsePrediction(record.getPredictionResultJson());
            if (pred != null && pred.riskLevel() != null) {
                switch (pred.riskLevel().toUpperCase()) {
                    case "HIGH" -> hasHigh = true;
                    case "MODERATE" -> hasModerate = true;
                    case "LOW" -> hasLow = true;
                }
            }
        }

        if (hasHigh) return "HIGH";
        if (hasModerate) return "MODERATE";
        if (hasLow) return "LOW";
        return "NONE";
    }

    private Integer resolveHighestRiskScore(List<MedicalRecord> records) {
        int maxScore = 0;
        boolean found = false;
        for (MedicalRecord record : records) {
            KidneyRiskPredictionResponse pred = parsePrediction(record.getPredictionResultJson());
            if (pred != null) {
                maxScore = Math.max(maxScore, pred.riskScore());
                found = true;
            }
        }
        return found ? maxScore : null;
    }

    private KidneyRiskPredictionResponse parsePrediction(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, KidneyRiskPredictionResponse.class);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Double> parseIndicators(String extractedJson) {
        if (extractedJson == null || extractedJson.isBlank()) return Collections.emptyMap();
        try {
            Map<String, Object> map = objectMapper.readValue(extractedJson, new TypeReference<>() {});
            Object indObj = map.get("indicators");
            if (indObj instanceof Map<?, ?> indMap) {
                Map<String, Double> result = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : indMap.entrySet()) {
                    if (entry.getValue() instanceof Number num) {
                        result.put(String.valueOf(entry.getKey()), num.doubleValue());
                    }
                }
                return result;
            }
        } catch (Exception e) {
            // Ignore
        }
        return Collections.emptyMap();
    }
}
