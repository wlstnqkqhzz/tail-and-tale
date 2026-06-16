package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 산책 참여 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum WalkParticipantErrorCode implements BaseErrorCode {
    WALK_NOT_OPEN(HttpStatus.BAD_REQUEST, "모집 중인 산책 일정만 참여할 수 있습니다."),                                  // 모집 중이 아닌 산책 일정
    CANNOT_JOIN_OWN_WALK(HttpStatus.BAD_REQUEST, "본인이 등록한 산책 일정에는 참여할 수 없습니다."),                      // 본인 산책 일정 참여 시도
    WALK_PARTICIPANT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근할 수 없는 산책 참여 정보입니다."),                       // 산책 참여 접근 권한 없음
    ALREADY_REQUESTED_WALK(HttpStatus.BAD_REQUEST, "이미 참여 신청한 산책 일정입니다."),                                // 중복 신청
    ALREADY_APPROVED_WALK(HttpStatus.BAD_REQUEST, "이미 참여 승인된 산책 일정입니다."),                                 // 이미 승인된 참여
    WALK_PARTICIPANT_FULL(HttpStatus.BAD_REQUEST, "산책 참여 인원이 가득 찼습니다."),                                  // 최대 참여 인원 초과
    WALK_PARTICIPANT_NOT_FOUND(HttpStatus.NOT_FOUND, "산책 참여 정보를 찾을 수 없습니다."),                            // 산책 참여 정보 조회 실패
    WALK_PARTICIPANT_ALREADY_CANCELED(HttpStatus.BAD_REQUEST, "이미 참여 취소된 산책입니다."),                         // 이미 참여 취소된 산책
    WALK_PARTICIPANT_NOT_REQUESTED(HttpStatus.BAD_REQUEST, "참여 신청 상태에서만 처리할 수 있습니다.");                 // 신청 상태가 아닌 참여

    private final HttpStatus status;
    private final String message;
}
