package com.renalCareAI.renalCareAI.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "chat_message_logs")
public class ChatMessageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String userEmail;

    private String userName;

    @Column(columnDefinition = "TEXT")
    private String userMessage;

    @Column(columnDefinition = "TEXT")
    private String assistantAnswer;

    @Column(columnDefinition = "TEXT")
    private String sourcesJson;

    private String riskAssessment;

    private Instant createdAt = Instant.now();

    public ChatMessageLog() {
    }

    public ChatMessageLog(
            Long userId,
            String userEmail,
            String userName,
            String userMessage,
            String assistantAnswer,
            String sourcesJson,
            String riskAssessment
    ) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.userName = userName;
        this.userMessage = userMessage;
        this.assistantAnswer = assistantAnswer;
        this.sourcesJson = sourcesJson;
        this.riskAssessment = riskAssessment;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public String getAssistantAnswer() {
        return assistantAnswer;
    }

    public void setAssistantAnswer(String assistantAnswer) {
        this.assistantAnswer = assistantAnswer;
    }

    public String getSourcesJson() {
        return sourcesJson;
    }

    public void setSourcesJson(String sourcesJson) {
        this.sourcesJson = sourcesJson;
    }

    public String getRiskAssessment() {
        return riskAssessment;
    }

    public void setRiskAssessment(String riskAssessment) {
        this.riskAssessment = riskAssessment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
