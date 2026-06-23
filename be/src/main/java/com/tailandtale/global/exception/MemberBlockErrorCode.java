package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 회원 차단 예외 코드

@Getter
@RequiredArgsConstructor
public enum MemberBlockErrorCode implements BaseErrorCode {
    CANNOT_BLOCK_SELF(HttpStatus.BAD_REQUEST, "본인은 차단할 수 없습니다."),
    MEMBER_BLOCKED(HttpStatus.FORBIDDEN, "차단 관계가 있는 회원입니다."),
    MEMBER_BLOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "회원 차단 정보를 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
