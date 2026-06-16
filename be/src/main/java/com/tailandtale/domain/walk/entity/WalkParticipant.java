package com.tailandtale.domain.walk.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "walk_participant",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_walk_participant",
                columnNames = {"walk_schedule_id", "member_id", "dog_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkParticipant extends BaseEntity {
    // 산책 참여 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "walk_participant_id")
    private Long id;

    // 산책 일정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_schedule_id", nullable = false)
    private WalkSchedule walkSchedule;

    // 참여 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 참여 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    // 참여 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WalkParticipantStatus status;

    // 참여 신청 메시지
    @Column(length = 300)
    private String message;

    // 산책 참여 생성
    private WalkParticipant(
            WalkSchedule walkSchedule,
            Member member,
            Dog dog,
            String message
    ) {
        this.walkSchedule = walkSchedule;
        this.member = member;
        this.dog = dog;
        this.message = message;
        this.status = WalkParticipantStatus.REQUESTED;
    }

    // 산책 참여 생성
    public static WalkParticipant create(
            WalkSchedule walkSchedule,
            Member member,
            Dog dog,
            String message
    ) {
        return new WalkParticipant(
                walkSchedule,
                member,
                dog,
                message
        );
    }

    // 참여 재신청
    public void requestAgain(String message) {
        this.message = message;
        this.status = WalkParticipantStatus.REQUESTED;
    }

    // 참여 승인
    public void approve() {
        this.status = WalkParticipantStatus.APPROVED;
    }

    // 참여 거절
    public void reject() {
        this.status = WalkParticipantStatus.REJECTED;
    }

    // 참여 취소
    public void cancel() {
        this.status = WalkParticipantStatus.CANCELED;
    }
}
