package com.tailandtale.domain.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 신뢰도 이력 Entity

@Entity
@Table(name = "trust_score_history")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrustScoreHistory {

    // 신뢰도 이력 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trust_score_history_id")
    private Long id;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 신뢰도 변동값
    @Column(name = "score_delta", nullable = false)
    private Integer scoreDelta;

    // 변경 후 신뢰도 점수
    @Column(name = "score_after", nullable = false)
    private Integer scoreAfter;

    // 변동 사유 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "reason_type", nullable = false)
    private TrustScoreReasonType reasonType;

    // 변동 사유 상세
    @Column(name = "reason_detail", length = 500)
    private String reasonDetail;

    // 연결 대상 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "related_type")
    private TrustScoreRelatedType relatedType;

    // 연결 대상 ID
    @Column(name = "related_id")
    private Long relatedId;

    // 생성일
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private TrustScoreHistory(
            Member member,
            Integer scoreDelta,
            Integer scoreAfter,
            TrustScoreReasonType reasonType,
            String reasonDetail,
            TrustScoreRelatedType relatedType,
            Long relatedId
    ) {
        this.member = member;
        this.scoreDelta = scoreDelta;
        this.scoreAfter = scoreAfter;
        this.reasonType = reasonType;
        this.reasonDetail = reasonDetail;
        this.relatedType = relatedType;
        this.relatedId = relatedId;
    }

    // 신뢰도 이력 생성
    public static TrustScoreHistory create(
            Member member,
            Integer scoreDelta,
            Integer scoreAfter,
            TrustScoreReasonType reasonType,
            String reasonDetail,
            TrustScoreRelatedType relatedType,
            Long relatedId
    ) {
        return new TrustScoreHistory(
                member,
                scoreDelta,
                scoreAfter,
                reasonType,
                reasonDetail,
                relatedType,
                relatedId
        );
    }
}
