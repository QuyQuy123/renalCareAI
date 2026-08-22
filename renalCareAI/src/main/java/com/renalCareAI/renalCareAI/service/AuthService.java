package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.request.LoginRequest;
import com.renalCareAI.renalCareAI.dto.request.RegisterRequest;
import com.renalCareAI.renalCareAI.dto.response.AuthResponse;

import com.renalCareAI.renalCareAI.dto.request.SendOtpRequest;

public interface AuthService {
    void sendOtp(SendOtpRequest request);
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
