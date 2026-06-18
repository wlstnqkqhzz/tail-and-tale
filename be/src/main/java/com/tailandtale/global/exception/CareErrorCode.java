package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 반려견 케어 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum CareErrorCode implements BaseErrorCode {
    EMOTION_DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "감정 일기를 찾을 수 없습니다."), // 감정 일기 조회 실패
    EMOTION_DIARY_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "해당 날짜의 감정 일기가 이미 존재합니다."), // 감정 일기 중복
    HEALTH_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "건강 기록을 찾을 수 없습니다."), // 건강 기록 조회 실패
    HEALTH_RECORD_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "해당 날짜의 건강 기록이 이미 존재합니다."), // 건강 기록 중복
    AI_ANALYSIS_NOT_FOUND(HttpStatus.NOT_FOUND, "AI 분석 결과를 찾을 수 없습니다."); // AI 분석 결과 조회 실패

    private final HttpStatus status;
    private final String message;
}
