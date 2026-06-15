package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 반려견 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum DogErrorCode implements BaseErrorCode {
    DOG_NOT_FOUND(HttpStatus.NOT_FOUND, "반려견을 찾을 수 없습니다."),          // 반려견 조회 실패
    DOG_ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근할 수 없는 반려견입니다.");    // 반려견 접근 권한 없음

    private final HttpStatus status;
    private final String message;
}
