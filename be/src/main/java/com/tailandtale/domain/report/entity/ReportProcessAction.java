package com.tailandtale.domain.report.entity;

// 신고 처리 작업 Enum

public enum ReportProcessAction {
    REVIEW_ONLY,
    REJECT_REPORT,
    RESOLVE_ONLY,
    DELETE_TARGET,
    BAN_REPORTED_MEMBER
}
