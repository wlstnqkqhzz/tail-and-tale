package com.tailandtale.global.exception;

import lombok.Getter;

// BaseErrorCode 기반 커스텀 예외 클래스

@Getter
public class CustomException extends RuntimeException {
    private final BaseErrorCode errorCode;

    public CustomException(BaseErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
