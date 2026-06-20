package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 관리자 기능 예외 코드

@Getter
@RequiredArgsConstructor
public enum AdminErrorCode implements BaseErrorCode {
    ADMIN_ACCESS_DENIED(HttpStatus.FORBIDDEN, "관리자만 접근할 수 있습니다."),
    ADMIN_SELF_STATUS_CHANGE_DENIED(HttpStatus.BAD_REQUEST, "본인 계정 상태는 관리자 화면에서 변경할 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
