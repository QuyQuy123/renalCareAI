package com.renalCareAI.renalCareAI.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renalCareAI.renalCareAI.dto.request.ChatRequest;
import com.renalCareAI.renalCareAI.dto.response.ChatResponse;
import com.renalCareAI.renalCareAI.model.ChatMessageLog;
import com.renalCareAI.renalCareAI.model.SiteMetric;
import com.renalCareAI.renalCareAI.model.VisitorLog;
import com.renalCareAI.renalCareAI.repository.ChatMessageLogRepository;
import com.renalCareAI.renalCareAI.repository.SiteMetricRepository;
import com.renalCareAI.renalCareAI.repository.VisitorLogRepository;
import com.renalCareAI.renalCareAI.service.AnalyticsTrackerService;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsTrackerServiceImpl implements AnalyticsTrackerService {
    public static final String KEY_PAGEVIEWS = "total_pageviews";
    public static final String KEY_CHAT_RESPONSES = "total_chat_responses";

    private final SiteMetricRepository siteMetricRepository;
    private final VisitorLogRepository visitorLogRepository;
    private final ChatMessageLogRepository chatMessageLogRepository;
    private final ObjectMapper objectMapper;

    public AnalyticsTrackerServiceImpl(
            SiteMetricRepository siteMetricRepository,
            VisitorLogRepository visitorLogRepository,
            ChatMessageLogRepository chatMessageLogRepository,
            ObjectMapper objectMapper
    ) {
        this.siteMetricRepository = siteMetricRepository;
        this.visitorLogRepository = visitorLogRepository;
        this.chatMessageLogRepository = chatMessageLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    @Override
    public void trackVisit(String visitorUuid, String ipAddress, String userAgent) {
        // Increment pageview counter
        incrementMetric(KEY_PAGEVIEWS);

        // Update or insert visitor log
        if (visitorUuid != null && !visitorUuid.isBlank()) {
            String cleanUuid = visitorUuid.trim();
            Optional<VisitorLog> existing = visitorLogRepository.findByVisitorUuid(cleanUuid);
            if (existing.isPresent()) {
                VisitorLog log = existing.get();
                log.setVisitCount(log.getVisitCount() + 1);
                log.setLastSeenAt(Instant.now());
                if (ipAddress != null && !ipAddress.isBlank()) {
                    log.setIpAddress(ipAddress);
                }
                if (userAgent != null && !userAgent.isBlank()) {
                    log.setUserAgent(userAgent);
                }
                visitorLogRepository.save(log);
            } else {
                VisitorLog newLog = new VisitorLog();
                newLog.setVisitorUuid(cleanUuid);
                newLog.setVisitCount(1);
                newLog.setIpAddress(ipAddress);
                newLog.setUserAgent(userAgent);
                visitorLogRepository.save(newLog);
            }
        }
    }

    @Transactional
    @Override
    public void incrementChatResponses() {
        incrementMetric(KEY_CHAT_RESPONSES);
    }

    @Transactional
    @Override
    public void logChatMessage(ChatRequest request, ChatResponse response) {
        if (request == null || response == null) {
            return;
        }

        // Increment total responses count
        incrementMetric(KEY_CHAT_RESPONSES);

        String sourcesJson = null;
        if (response.sources() != null && !response.sources().isEmpty()) {
            try {
                sourcesJson = objectMapper.writeValueAsString(response.sources());
            } catch (JsonProcessingException e) {
                sourcesJson = "[]";
            }
        }

        // Simple clinical keyword detection for risk tagging
        String ans = response.answer() != null ? response.answer().toLowerCase() : "";
        String risk = "NONE";
        if (ans.contains("nguy cơ cao") || ans.contains("suy thận giai đoạn 4") || ans.contains("giai đoạn 5") || ans.contains("chạy thận")) {
            risk = "HIGH";
        } else if (ans.contains("nguy cơ trung bình") || ans.contains("nguy cơ vừa") || ans.contains("giai đoạn 3")) {
            risk = "MODERATE";
        } else if (ans.contains("nguy cơ thấp") || ans.contains("chức năng thận bình thường") || ans.contains("giai đoạn 1") || ans.contains("giai đoạn 2")) {
            risk = "LOW";
        }

        String email = request.userEmail() != null && !request.userEmail().isBlank()
                ? request.userEmail()
                : "Khách vãng lai";
        String name = request.userName() != null && !request.userName().isBlank()
                ? request.userName()
                : "Khách ẩn danh";

        ChatMessageLog log = new ChatMessageLog(
                request.userId(),
                email,
                name,
                request.message(),
                response.answer(),
                sourcesJson,
                risk
        );
        chatMessageLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    @Override
    public long getUniqueVisitorsCount() {
        return visitorLogRepository.count();
    }

    @Transactional(readOnly = true)
    @Override
    public long getTotalPageviewsCount() {
        return siteMetricRepository.findByMetricKey(KEY_PAGEVIEWS)
                .map(SiteMetric::getMetricValue)
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    @Override
    public long getTotalChatResponsesCount() {
        return siteMetricRepository.findByMetricKey(KEY_CHAT_RESPONSES)
                .map(SiteMetric::getMetricValue)
                .orElse(0L);
    }

    private void incrementMetric(String key) {
        SiteMetric metric = siteMetricRepository.findByMetricKey(key)
                .orElseGet(() -> new SiteMetric(key, 0L));
        metric.setMetricValue(metric.getMetricValue() + 1);
        siteMetricRepository.save(metric);
    }
}
