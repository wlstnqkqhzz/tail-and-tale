package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 채팅 관련 예외 코드

@Getter
@RequiredArgsConstructor
public enum ChatErrorCode implements BaseErrorCode {
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."),
    CHAT_ROOM_CLOSED(HttpStatus.BAD_REQUEST, "닫힌 채팅방에는 메시지를 보낼 수 없습니다."),
    CHAT_ROOM_ACCESS_DENIED(HttpStatus.FORBIDDEN, "채팅방에 접근할 권한이 없습니다."),
    CHAT_MESSAGE_EMPTY(HttpStatus.BAD_REQUEST, "채팅 메시지를 입력해주세요."),
    CHAT_MESSAGE_TOO_LONG(HttpStatus.BAD_REQUEST, "채팅 메시지는 1000자 이하로 입력해주세요.");

    private final HttpStatus status;
    private final String message;
}
