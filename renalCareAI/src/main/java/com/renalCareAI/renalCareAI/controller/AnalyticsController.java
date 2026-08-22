package com.renalCareAI.renalCareAI.controller;

import com.renalCareAI.renalCareAI.service.AnalyticsTrackerService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsTrackerService analyticsTrackerService;

    public AnalyticsController(AnalyticsTrackerService analyticsTrackerService) {
        this.analyticsTrackerService = analyticsTrackerService;
    }

    @PostMapping("/track")
    @ResponseStatus(HttpStatus.OK)
    public void trackVisit(
            @RequestBody(required = false) Map<String, Object> payload,
            HttpServletRequest request
    ) {
        if (payload != null) {
            Object isAdminObj = payload.get("isAdmin");
            if (isAdminObj != null && (Boolean.TRUE.equals(isAdminObj) || "true".equalsIgnoreCase(String.valueOf(isAdminObj)))) {
                return;
            }
            String page = payload.get("page") != null ? String.valueOf(payload.get("page")) : "";
            if (page.startsWith("/admin")) {
                return;
            }
        }

        String visitorUuid = payload != null && payload.get("visitorId") != null ? String.valueOf(payload.get("visitorId")) : null;
        String userAgent = request.getHeader("User-Agent");
        String ipAddress = extractIp(request);
        analyticsTrackerService.trackVisit(visitorUuid, ipAddress, userAgent);
    }

    private String extractIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
