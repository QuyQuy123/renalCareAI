package com.renalCareAI.renalCareAI.repository;

import com.renalCareAI.renalCareAI.model.SiteMetric;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteMetricRepository extends JpaRepository<SiteMetric, String> {
    Optional<SiteMetric> findByMetricKey(String metricKey);
}
