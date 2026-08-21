package com.renalCareAI.renalCareAI.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank
        @Size(max = 120)
        String fullName,

        @NotBlank
        @Email
        @Size(max = 160)
        String email,

        @Size(max = 30)
        String phoneNumber,

        LocalDate dateOfBirth,

        @Size(max = 20)
        String gender,

        @Size(max = 255)
        String address,

        @Size(max = 1000)
        String healthNote
) {
}
