package com.renalCareAI.renalCareAI.service;

import com.renalCareAI.renalCareAI.dto.request.UpdateProfileRequest;
import com.renalCareAI.renalCareAI.dto.response.UserProfileResponse;
import com.renalCareAI.renalCareAI.model.User;

public interface UserService {
    UserProfileResponse getProfile(Long userId);

    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);

    User findUser(Long userId);
}
