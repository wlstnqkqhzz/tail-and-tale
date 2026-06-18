package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 산책 후기 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum WalkReviewErrorCode implements BaseErrorCode {
    WALK_REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "산책 후기를 찾을 수 없습니다."), // 산책 후기 조회 실패
    WALK_REVIEW_ACCESS_DENIED(HttpStatus.FORBIDDEN, "산책 후기에 접근할 수 없습니다."), // 산책 후기 접근 권한 없음
    WALK_REVIEW_TARGET_INVALID(HttpStatus.BAD_REQUEST, "후기 대상 회원이 올바르지 않습니다."), // 후기 대상 오류
    WALK_REVIEW_SELF_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "본인에게 후기를 작성할 수 없습니다."), // 본인 후기 작성 방지
    WALK_REVIEW_DUPLICATED(HttpStatus.BAD_REQUEST, "이미 해당 회원에게 작성한 후기가 있습니다."), // 중복 후기 작성
    WALK_REVIEW_NOT_FINISHED(HttpStatus.BAD_REQUEST, "산책 예정 시간이 지난 뒤 후기를 작성할 수 있습니다."), // 산책 전 후기 작성 방지
    WALK_REVIEW_CANCELED_SCHEDULE(HttpStatus.BAD_REQUEST, "취소된 산책에는 후기를 작성할 수 없습니다."); // 취소 산책 후기 작성 방지

    private final HttpStatus status;
    private final String message;
}
