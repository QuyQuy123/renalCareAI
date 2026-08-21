package com.renalCareAI.renalCareAI.service.impl;

import com.renalCareAI.renalCareAI.dto.response.MedicalRecordResponse;
import com.renalCareAI.renalCareAI.model.MedicalRecord;
import com.renalCareAI.renalCareAI.model.MedicalRecordStatus;
import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.repository.MedicalRecordRepository;
import com.renalCareAI.renalCareAI.service.MedicalRecordService;
import com.renalCareAI.renalCareAI.service.UserService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MedicalRecordServiceImpl implements MedicalRecordService {
    private final MedicalRecordRepository medicalRecordRepository;
    private final UserService userService;
    private final Path storageDirectory;

    public MedicalRecordServiceImpl(
            MedicalRecordRepository medicalRecordRepository,
            UserService userService,
            @Value("${app.medical-records.storage-directory:uploads/medical-records}") String storageDirectory
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.userService = userService;
        this.storageDirectory = Path.of(storageDirectory).normalize();
    }

    @Transactional(readOnly = true)
    @Override
    public List<MedicalRecordResponse> listRecords(Long userId) {
        userService.findUser(userId);
        return medicalRecordRepository.findByUserIdOrderByUploadedAtDesc(userId).stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    @Transactional
    @Override
    public MedicalRecordResponse uploadRecord(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui long chon file ho so kham");
        }

        User user = userService.findUser(userId);
        String originalFileName = cleanFileName(file.getOriginalFilename());
        String extension = fileExtension(originalFileName);
        String storedFileName = UUID.randomUUID() + extension;
        Path userDirectory = storageDirectory.resolve(String.valueOf(userId)).normalize();
        Path targetFile = userDirectory.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(userDirectory);
            file.transferTo(targetFile);
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the luu file ho so kham", error);
        }

        MedicalRecord record = new MedicalRecord();
        record.setUser(user);
        record.setOriginalFileName(originalFileName);
        record.setStoredFileName(storedFileName);
        record.setFilePath(targetFile.toString());
        record.setContentType(file.getContentType());
        record.setFileSize(file.getSize());
        record.setStatus(MedicalRecordStatus.PENDING_ANALYSIS);
        record.setRiskSummary("Da tai len. He thong se phan tich nguy co benh than o buoc tiep theo.");

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
    }

    private String cleanFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "medical-record";
        }
        return Path.of(fileName).getFileName().toString();
    }

    private String fileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex);
    }
}
