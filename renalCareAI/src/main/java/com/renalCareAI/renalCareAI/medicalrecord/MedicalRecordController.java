package com.renalCareAI.renalCareAI.medicalrecord;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/{userId}/medical-records")
public class MedicalRecordController {
    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping
    public List<MedicalRecordResponse> listRecords(@PathVariable Long userId) {
        return medicalRecordService.listRecords(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalRecordResponse uploadRecord(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file
    ) {
        return medicalRecordService.uploadRecord(userId, file);
    }
}
