package com.tailandtale.domain.member.entity;

// 신뢰도 변동 연결 대상 유형 Enum

public enum TrustScoreRelatedType {
    WALK_SCHEDULE,      // 산책 일정
    WALK_REVIEW,        // 산책 후기
    REPORT,             // 신고
    BADGE,              // 뱃지
    ADMIN,              // 관리자
    ETC                 // 기타
}
