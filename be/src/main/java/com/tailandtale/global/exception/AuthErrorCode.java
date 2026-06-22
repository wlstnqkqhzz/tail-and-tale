package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 로그인 및 JWT 인증 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements BaseErrorCode {
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),           // 로그인 실패
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다."),                  // 비밀번호 불일치
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),                       // Access Token 유효하지 않음
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),                         // Access Token 만료
    ACCOUNT_INACTIVE(HttpStatus.LOCKED, "오랫동안 로그인하지 않아 휴면 상태로 전환된 계정입니다."), // 휴면 계정 로그인 차단
    ACCOUNT_BANNED(HttpStatus.FORBIDDEN, "정지된 계정은 로그인할 수 없습니다."),               // 정지 계정 로그인 차단
    ACCOUNT_DELETED(HttpStatus.FORBIDDEN, "탈퇴한 계정은 로그인할 수 없습니다.");              // 탈퇴 계정 로그인 차단

    private final HttpStatus status;
    private final String message;
}
