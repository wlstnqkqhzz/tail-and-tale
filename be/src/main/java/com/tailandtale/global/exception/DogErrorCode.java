package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 반려견 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum DogErrorCode implements BaseErrorCode {
    DOG_NOT_FOUND(HttpStatus.NOT_FOUND, "반려견을 찾을 수 없습니다."),                                              // 반려견 조회 실패
    DOG_ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근할 수 없는 반려견입니다."),                                        // 반려견 접근 권한 없음
    DOG_NOT_VERIFIED(HttpStatus.FORBIDDEN, "먼저 반려견 인증을 진행해주세요."),                                      // 반려견 미인증
    DOG_VERIFICATION_NOT_READY(HttpStatus.NOT_IMPLEMENTED, "반려견 인증 API 설정이 필요합니다."),                    // 반려견 인증 설정 누락
    DOG_VERIFICATION_OWNER_REQUIRED(HttpStatus.BAD_REQUEST, "반려견 인증을 위해 회원 실명이 필요합니다."),             // 소유자명 누락
    DOG_VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "동물등록번호 인증에 실패했습니다."),                             // 반려견 인증 실패
    DOG_VERIFICATION_API_ERROR(HttpStatus.BAD_GATEWAY, "동물등록번호 인증 API 호출에 실패했습니다.");                 // 반려견 인증 API 호출 실패

    private final HttpStatus status;
    private final String message;
}
