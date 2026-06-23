package com.tailandtale.domain.member.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 회원 차단 Entity

@Entity
@Table(
        name = "member_block",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_member_block", columnNames = {"blocker_member_id", "blocked_member_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberBlock extends BaseEntity {

    // 회원 차단 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_block_id")
    private Long id;

    // 차단한 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_member_id", nullable = false)
    private Member blockerMember;

    // 차단된 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_member_id", nullable = false)
    private Member blockedMember;

    // 차단 사유
    @Column(length = 300)
    private String reason;

    // 차단 일시
    @Column(name = "blocked_at", nullable = false)
    private LocalDateTime blockedAt;

    // 차단 해제 일시
    @Column(name = "unblocked_at")
    private LocalDateTime unblockedAt;

    // 회원 차단 생성
    private MemberBlock(
            Member blockerMember,
            Member blockedMember,
            String reason
    ) {
        this.blockerMember = blockerMember;
        this.blockedMember = blockedMember;
        this.reason = reason;
        this.blockedAt = LocalDateTime.now();
    }

    // 회원 차단 생성
    public static MemberBlock create(
            Member blockerMember,
            Member blockedMember,
            String reason
    ) {
        return new MemberBlock(
                blockerMember,
                blockedMember,
                reason
        );
    }

    // 차단 재활성화
    public void blockAgain(String reason) {
        this.reason = reason;
        this.blockedAt = LocalDateTime.now();
        this.unblockedAt = null;
    }

    // 차단 해제
    public void unblock() {
        this.unblockedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return this.unblockedAt == null;
    }
}
