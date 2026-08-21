package com.renalCareAI.renalCareAI.auth;

import com.renalCareAI.renalCareAI.user.User;
import com.renalCareAI.renalCareAI.user.UserRole;

public record AuthResponse(
        Long id,
        String fullName,
        String email,
        UserRole role
) {
    public static AuthResponse from(User user) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
