package com.tailandtale.domain.care.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 산책 기록 Entity

@Entity
@Table(name = "walk_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkRecord extends BaseEntity {

    // 산책 기록 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "walk_record_id")
    private Long id;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    // 연결된 산책 일정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_schedule_id")
    private WalkSchedule walkSchedule;

    // 산책 시작 일시
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    // 산책 종료 일시
    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // 산책 시간(분)
    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    // 산책 거리(km)
    @Column(name = "distance_km", precision = 6, scale = 2)
    private BigDecimal distanceKm;

    // 산책 경로 요약
    @Column(name = "route_summary", length = 500)
    private String routeSummary;

    // 산책 메모
    @Column(length = 1000)
    private String memo;

    // 산책 후 컨디션
    @Enumerated(EnumType.STRING)
    @Column(name = "condition_after_walk", length = 20)
    private ConditionAfterWalk conditionAfterWalk;

    // 산책 기록 생성
    private WalkRecord(
            Member member,
            Dog dog,
            WalkSchedule walkSchedule,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationMinutes,
            BigDecimal distanceKm,
            String routeSummary,
            String memo,
            ConditionAfterWalk conditionAfterWalk
    ) {
        this.member = member;
        this.dog = dog;
        this.walkSchedule = walkSchedule;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.durationMinutes = durationMinutes;
        this.distanceKm = distanceKm;
        this.routeSummary = routeSummary;
        this.memo = memo;
        this.conditionAfterWalk = conditionAfterWalk;
    }

    // 산책 기록 생성
    public static WalkRecord create(
            Member member,
            Dog dog,
            WalkSchedule walkSchedule,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationMinutes,
            BigDecimal distanceKm,
            String routeSummary,
            String memo,
            ConditionAfterWalk conditionAfterWalk
    ) {
        return new WalkRecord(
                member,
                dog,
                walkSchedule,
                startedAt,
                endedAt,
                durationMinutes,
                distanceKm,
                routeSummary,
                memo,
                conditionAfterWalk
        );
    }

    // 산책 기록 수정
    public void update(
            Dog dog,
            WalkSchedule walkSchedule,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationMinutes,
            BigDecimal distanceKm,
            String routeSummary,
            String memo,
            ConditionAfterWalk conditionAfterWalk
    ) {
        if (dog != null) {
            this.dog = dog;
        }
        if (walkSchedule != null) {
            this.walkSchedule = walkSchedule;
        }
        if (startedAt != null) {
            this.startedAt = startedAt;
        }
        if (endedAt != null) {
            this.endedAt = endedAt;
        }
        if (durationMinutes != null) {
            this.durationMinutes = durationMinutes;
        }
        if (distanceKm != null) {
            this.distanceKm = distanceKm;
        }
        if (routeSummary != null) {
            this.routeSummary = routeSummary;
        }
        if (memo != null) {
            this.memo = memo;
        }
        if (conditionAfterWalk != null) {
            this.conditionAfterWalk = conditionAfterWalk;
        }
    }
}
