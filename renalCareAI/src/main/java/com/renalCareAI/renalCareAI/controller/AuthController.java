package com.renalCareAI.renalCareAI.controller;

import com.renalCareAI.renalCareAI.dto.request.SendOtpRequest;
import com.renalCareAI.renalCareAI.dto.request.LoginRequest;
import com.renalCareAI.renalCareAI.dto.request.RegisterRequest;
import com.renalCareAI.renalCareAI.dto.response.AuthResponse;
import com.renalCareAI.renalCareAI.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    @ResponseStatus(HttpStatus.OK)
    public void sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
