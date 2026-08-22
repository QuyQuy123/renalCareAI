package com.renalCareAI.renalCareAI.repository;

import com.renalCareAI.renalCareAI.model.ChatMessageLog;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageLogRepository extends JpaRepository<ChatMessageLog, Long> {

    List<ChatMessageLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ChatMessageLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    Page<ChatMessageLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT c FROM ChatMessageLog c WHERE "
            + "LOWER(c.userMessage) LIKE LOWER(CONCAT('%', :kw, '%')) OR "
            + "LOWER(c.assistantAnswer) LIKE LOWER(CONCAT('%', :kw, '%')) OR "
            + "LOWER(c.userEmail) LIKE LOWER(CONCAT('%', :kw, '%')) OR "
            + "LOWER(c.userName) LIKE LOWER(CONCAT('%', :kw, '%')) "
            + "ORDER BY c.createdAt DESC")
    Page<ChatMessageLog> searchLogs(@Param("kw") String keyword, Pageable pageable);
}
