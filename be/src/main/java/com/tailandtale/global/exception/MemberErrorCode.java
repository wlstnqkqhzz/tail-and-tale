package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 회원 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum MemberErrorCode implements BaseErrorCode {
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다."),            // 이메일 중복
    DUPLICATE_NICKNAME(HttpStatus.BAD_REQUEST, "이미 사용 중인 닉네임입니다."),         // 닉네임 중복
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),                // 회원 조회 실패
    PROFILE_INCOMPLETE(HttpStatus.FORBIDDEN, "추가 정보를 먼저 입력해주세요.");        // OAuth 추가 정보 미입력

    private final HttpStatus status;
    private final String message;
}
