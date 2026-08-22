package com.renalCareAI.renalCareAI.repository;

import com.renalCareAI.renalCareAI.model.OtpSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpSessionRepository extends JpaRepository<OtpSession, Long> {
    Optional<OtpSession> findByEmailIgnoreCase(String email);
    void deleteByEmailIgnoreCase(String email);
}
