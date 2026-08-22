package com.renalCareAI.renalCareAI.config;

import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.model.UserRole;
import com.renalCareAI.renalCareAI.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);
    private static final String DEFAULT_ADMIN_EMAIL = "admin@renalcareai.com";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmailIgnoreCase(DEFAULT_ADMIN_EMAIL)) {
            User admin = new User();
            admin.setFullName("Hệ thống Quản trị viên");
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode("Admin@123456"));
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(AccountStatus.ACTIVE);
            admin.setPhoneNumber("0900000000");
            admin.setAddress("Trung tâm Quản trị RenalCareAI");
            admin.setHealthNote("Tài khoản quản trị viên chính của hệ thống RenalCareAI.");
            userRepository.save(admin);
            log.info("Initialized default administrator account: {}", DEFAULT_ADMIN_EMAIL);
        }
    }
}
