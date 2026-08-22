package com.renalCareAI.renalCareAI.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendOtpRequest(
        @NotBlank(message = "Vui long nhap email")
        @Email(message = "Email khong hop le")
        @Size(max = 160, message = "Email khong duoc vuot qua 160 ky tu")
        String email
) {
}
