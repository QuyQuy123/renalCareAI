package com.renalCareAI.renalCareAI.repository;

import com.renalCareAI.renalCareAI.model.VisitorLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {
    Optional<VisitorLog> findByVisitorUuid(String visitorUuid);
}
