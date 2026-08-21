package com.renalCareAI.renalCareAI.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Vui long nhap email")
        @Email(message = "Email khong hop le")
        String email,

        @NotBlank(message = "Vui long nhap mat khau")
        String password
) {
}
