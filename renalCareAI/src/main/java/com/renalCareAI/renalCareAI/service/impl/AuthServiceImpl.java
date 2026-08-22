package com.renalCareAI.renalCareAI.service.impl;

import com.renalCareAI.renalCareAI.dto.request.LoginRequest;
import com.renalCareAI.renalCareAI.dto.request.RegisterRequest;
import com.renalCareAI.renalCareAI.dto.response.AuthResponse;
import com.renalCareAI.renalCareAI.model.AccountStatus;
import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.model.UserRole;
import com.renalCareAI.renalCareAI.repository.UserRepository;
import com.renalCareAI.renalCareAI.service.AuthService;
import com.renalCareAI.renalCareAI.dto.request.SendOtpRequest;
import com.renalCareAI.renalCareAI.model.OtpSession;
import com.renalCareAI.renalCareAI.repository.OtpSessionRepository;
import com.renalCareAI.renalCareAI.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpSessionRepository otpSessionRepository;
    private final EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           OtpSessionRepository otpSessionRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpSessionRepository = otpSessionRepository;
        this.emailService = emailService;
    }

    @Transactional
    @Override
    public void sendOtp(SendOtpRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email nay da duoc dang ky");
        }

        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        // Create or Update OTP Session
        OtpSession otpSession = otpSessionRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElse(new OtpSession());
        otpSession.setEmail(normalizedEmail);
        otpSession.setOtpCode(otp);
        otpSession.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        
        otpSessionRepository.save(otpSession);
        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    @Transactional
    @Override
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email nay da duoc dang ky");
        }

        OtpSession session = otpSessionRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui long yeu cau ma OTP truoc"));

        if (!session.getOtpCode().equals(request.otp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma OTP khong chinh xac");
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma OTP da het han");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(AccountStatus.ACTIVE);

        User savedUser = userRepository.save(user);
        otpSessionRepository.delete(session);

        return AuthResponse.from(savedUser);
    }

    @Transactional(readOnly = true)
    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> invalidCredentials());

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tai khoan hien khong hoat dong");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        return AuthResponse.from(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoac mat khau khong dung");
    }
}
