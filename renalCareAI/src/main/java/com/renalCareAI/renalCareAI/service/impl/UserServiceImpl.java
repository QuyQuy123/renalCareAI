package com.renalCareAI.renalCareAI.service.impl;

import com.renalCareAI.renalCareAI.dto.request.UpdateProfileRequest;
import com.renalCareAI.renalCareAI.dto.response.UserProfileResponse;
import com.renalCareAI.renalCareAI.model.User;
import com.renalCareAI.renalCareAI.repository.UserRepository;
import com.renalCareAI.renalCareAI.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public UserProfileResponse getProfile(Long userId) {
        return UserProfileResponse.from(findUser(userId));
    }

    @Transactional
    @Override
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        String normalizedEmail = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email nay da duoc tai khoan khac su dung");
                });

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(clean(request.phoneNumber()));
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(clean(request.gender()));
        user.setAddress(clean(request.address()));
        user.setHealthNote(clean(request.healthNote()));

        return UserProfileResponse.from(userRepository.save(user));
    }

    @Override
    public User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nguoi dung"));
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
