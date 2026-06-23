package com.tailandtale.domain.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 회원 뱃지 Entity

@Entity
@Table(
        name = "member_badge",
        uniqueConstraints = @UniqueConstraint(name = "uk_member_badge", columnNames = {"member_id", "badge_id"})
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberBadge {

    // 회원 뱃지 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_badge_id")
    private Long id;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 뱃지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    // 획득 사유
    @Column(name = "earned_reason", length = 300)
    private String earnedReason;

    // 획득일
    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    // 생성일
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private MemberBadge(
            Member member,
            Badge badge,
            String earnedReason
    ) {
        this.member = member;
        this.badge = badge;
        this.earnedReason = earnedReason;
        this.earnedAt = LocalDateTime.now();
    }

    // 회원 뱃지 생성
    public static MemberBadge create(
            Member member,
            Badge badge,
            String earnedReason
    ) {
        return new MemberBadge(
                member,
                badge,
                earnedReason
        );
    }
}
