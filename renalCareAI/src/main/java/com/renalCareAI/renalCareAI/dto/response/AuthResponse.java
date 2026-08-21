package com.renalCareAI.renalCareAI.dto.response;

import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.model.UserRole;
import java.time.LocalDate;

public record AuthResponse(
        Long id,
        String fullName,
        String email,
        UserRole role,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String healthNote
) {
    public static AuthResponse from(User user) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAddress(),
                user.getHealthNote()
        );
    }
}
