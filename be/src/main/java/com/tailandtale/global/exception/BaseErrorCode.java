package com.tailandtale.global.exception;

import org.springframework.http.HttpStatus;

// 공통 예외 코드 인터페이스

public interface BaseErrorCode {
    // HTTP 상태 코드 반환
    HttpStatus getStatus();

    // 에러 메시지 반환
    String getMessage();
}
