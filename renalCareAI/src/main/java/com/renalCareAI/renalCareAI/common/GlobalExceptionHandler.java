package com.renalCareAI.renalCareAI.common;

import com.renalCareAI.renalCareAI.chat.RagServiceException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return ResponseEntity
                .status(status)
                .body(new ApiError(Instant.now(), status.value(), exception.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null ? "Du lieu khong hop le" : error.getDefaultMessage())
                .orElse("Du lieu khong hop le");

        return ResponseEntity
                .badRequest()
                .body(new ApiError(Instant.now(), HttpStatus.BAD_REQUEST.value(), message));
    }

    @ExceptionHandler(RagServiceException.class)
    ResponseEntity<ApiError> handleRagService(RagServiceException exception) {
        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(new ApiError(Instant.now(), HttpStatus.BAD_GATEWAY.value(), exception.getMessage()));
    }
}
