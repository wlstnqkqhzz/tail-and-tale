package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 신고 관련 예외 코드

@Getter
@RequiredArgsConstructor
public enum ReportErrorCode implements BaseErrorCode {
    REPORT_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "신고 대상을 찾을 수 없습니다."),
    REPORT_SELF_DENIED(HttpStatus.BAD_REQUEST, "본인은 신고할 수 없습니다."),
    REPORT_SELF_PROCESS_DENIED(HttpStatus.FORBIDDEN, "본인을 대상으로 한 신고는 직접 처리할 수 없습니다."),
    REPORT_DUPLICATED(HttpStatus.CONFLICT, "이미 신고한 대상입니다."),
    REPORT_CONTENT_REQUIRED(HttpStatus.BAD_REQUEST, "기타 신고 사유는 상세 내용을 입력해주세요."),
    REPORT_ACTION_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "해당 신고 대상에는 선택한 처리 작업을 적용할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고 내역을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
