package com.tailandtale.global.exception;

import lombok.Builder;
import lombok.Getter;

// 예외 응답 DTO

@Getter
@Builder
public class ErrorResponse {

    // HTTP 상태 코드
    private int status;

    // 에러 이름
    private String error;

    // 에러 메시지
    private String message;

    // ErrorResponse 생성
    public static ErrorResponse of(BaseErrorCode errorCode) {
        return ErrorResponse.builder()
                .status(errorCode.getStatus().value())
                .error(errorCode.getStatus().name())
                .message(errorCode.getMessage())
                .build();
    }

    // ErrorResponse 직접 생성
    public static ErrorResponse of(int status, String error, String message) {
        return ErrorResponse.builder()
                .status(status)
                .error(error)
                .message(message)
                .build();
    }
}
