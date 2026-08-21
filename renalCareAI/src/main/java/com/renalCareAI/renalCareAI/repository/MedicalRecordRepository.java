package com.renalCareAI.renalCareAI.repository;

import com.renalCareAI.renalCareAI.model.MedicalRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByUserIdOrderByUploadedAtDesc(Long userId);
}
