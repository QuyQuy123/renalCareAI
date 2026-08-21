package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.request.LoginRequest;
import com.renalCareAI.renalCareAI.dto.request.RegisterRequest;
import com.renalCareAI.renalCareAI.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
