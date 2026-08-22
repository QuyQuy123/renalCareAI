package com.renalCareAI.renalCareAI.service;

public interface AnalyticsTrackerService {
    void trackVisit(String visitorUuid, String ipAddress, String userAgent);

    void incrementChatResponses();

    void logChatMessage(
            com.renalCareAI.renalCareAI.dto.request.ChatRequest request,
            com.renalCareAI.renalCareAI.dto.response.ChatResponse response
    );

    long getUniqueVisitorsCount();

    long getTotalPageviewsCount();

    long getTotalChatResponsesCount();
}
