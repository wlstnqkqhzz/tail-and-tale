package com.tailandtale.domain.member.entity;

// 회원 상태 Enum

public enum MemberStatus {
    PENDING,    // 추가 정보 입력 대기
    ACTIVE,     // 정상
    INACTIVE,   // 휴면
    BANNED      // 정지
}