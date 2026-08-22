package com.renalCareAI.renalCareAI.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "site_metrics")
public class SiteMetric {
    @Id
    @Column(name = "metric_key", nullable = false, unique = true, length = 64)
    private String metricKey;

    @Column(name = "metric_value", nullable = false)
    private long metricValue;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public SiteMetric() {
    }

    public SiteMetric(String metricKey, long metricValue) {
        this.metricKey = metricKey;
        this.metricValue = metricValue;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    @PreUpdate
    void onSave() {
        updatedAt = Instant.now();
    }

    public String getMetricKey() {
        return metricKey;
    }

    public void setMetricKey(String metricKey) {
        this.metricKey = metricKey;
    }

    public long getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(long metricValue) {
        this.metricValue = metricValue;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
