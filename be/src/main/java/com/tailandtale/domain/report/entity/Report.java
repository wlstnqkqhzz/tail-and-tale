package com.tailandtale.domain.report.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 신고 Entity

@Entity
@Table(
        name = "report",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_report_reporter_target",
                columnNames = {"reporter_member_id", "target_type", "target_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

    // 신고 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    // 신고한 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_member_id", nullable = false)
    private Member reporter;

    // 신고 대상 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_member_id")
    private Member reportedMember;

    // 신고 대상 타입
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private ReportTargetType targetType;

    // 신고 대상 ID
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 신고 사유
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    // 신고 상세 내용
    @Column(length = 1000)
    private String content;

    // 처리 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    // 처리 관리자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_member_id")
    private Member adminMember;

    // 관리자 메모
    @Column(name = "admin_memo", length = 1000)
    private String adminMemo;

    // 처리일
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    private Report(
            Member reporter,
            Member reportedMember,
            ReportTargetType targetType,
            Long targetId,
            ReportReason reason,
            String content
    ) {
        this.reporter = reporter;
        this.reportedMember = reportedMember;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.content = content;
        this.status = ReportStatus.PENDING;
    }

    // 신고 생성
    public static Report create(
            Member reporter,
            Member reportedMember,
            ReportTargetType targetType,
            Long targetId,
            ReportReason reason,
            String content
    ) {
        return new Report(
                reporter,
                reportedMember,
                targetType,
                targetId,
                reason,
                content
        );
    }

    // 신고 처리
    public void process(
            Member adminMember,
            ReportStatus status,
            String adminMemo
    ) {
        this.adminMember = adminMember;
        this.status = status;
        this.adminMemo = adminMemo;
        this.processedAt = LocalDateTime.now();
    }
}
