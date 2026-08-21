package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.response.MedicalRecordResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface MedicalRecordService {
    List<MedicalRecordResponse> listRecords(Long userId);

    MedicalRecordResponse uploadRecord(Long userId, MultipartFile file);
}
