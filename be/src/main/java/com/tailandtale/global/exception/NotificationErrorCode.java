package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 알림 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements BaseErrorCode {
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."); // 알림 조회 실패

    private final HttpStatus status;
    private final String message;
}
