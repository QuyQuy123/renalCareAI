package com.renalCareAI.renalCareAI.dto.response;

import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.model.UserRole;
import java.time.LocalDate;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String healthNote,
        UserRole role
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAddress(),
                user.getHealthNote(),
                user.getRole()
        );
    }
}
