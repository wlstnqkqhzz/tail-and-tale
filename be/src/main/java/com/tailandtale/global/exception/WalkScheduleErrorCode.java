package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 산책 일정 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum WalkScheduleErrorCode implements BaseErrorCode {
    WALK_SCHEDULE_NOT_FOUND(HttpStatus.NOT_FOUND, "산책 일정을 찾을 수 없습니다."),      // 산책 일정 조회 실패
    WALK_SCHEDULE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근할 수 없는 산책 일정입니다."), // 산책 일정 접근 권한 없음
    WALK_SCHEDULE_DOG_ACCESS_DENIED(HttpStatus.FORBIDDEN, "본인 반려견만 산책 일정에 등록할 수 있습니다."), // 반려견 접근 권한 없음
    WALK_SCHEDULE_ALREADY_CANCELED(HttpStatus.BAD_REQUEST, "이미 취소된 산책 일정입니다."); // 이미 취소된 산책 일정

    private final HttpStatus status;
    private final String message;
}
