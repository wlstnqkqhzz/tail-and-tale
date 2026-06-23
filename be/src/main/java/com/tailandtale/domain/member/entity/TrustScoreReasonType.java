package com.tailandtale.domain.member.entity;

// 신뢰도 변동 사유 유형 Enum

public enum TrustScoreReasonType {
    WALK_COMPLETED,     // 산책 완료
    REVIEW_RECEIVED,    // 후기 수신
    REPORT_RESOLVED,    // 신고 처리
    ADMIN_ADJUST,       // 관리자 조정
    BADGE_EARNED,       // 뱃지 획득
    ETC                 // 기타
}
