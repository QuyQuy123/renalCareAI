package com.renalCareAI.renalCareAI.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Vui long nhap ho ten")
        @Size(max = 120, message = "Ho ten khong duoc vuot qua 120 ky tu")
        String fullName,

        @NotBlank(message = "Vui long nhap email")
        @Email(message = "Email khong hop le")
        @Size(max = 160, message = "Email khong duoc vuot qua 160 ky tu")
        String email,

        @NotBlank(message = "Vui long nhap mat khau")
        @Size(min = 8, max = 72, message = "Mat khau phai co tu 8 den 72 ky tu")
        String password,

        @NotBlank(message = "Vui long nhap ma xac nhan OTP")
        @Size(min = 6, max = 6, message = "Ma OTP phai co dung 6 ky tu")
        String otp
) {
}
