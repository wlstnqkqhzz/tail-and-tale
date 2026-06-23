package com.tailandtale.domain.walk.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 산책 일정 Entity

@Entity
@Table(name = "walk_schedule")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkSchedule extends BaseEntity {

    // 산책 일정 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "walk_schedule_id")
    private Long id;

    // 일정 등록 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_member_id", nullable = false)
    private Member hostMember;

    // 일정 등록 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_dog_id", nullable = false)
    private Dog hostDog;

    // 산책 일정 제목
    @Column(nullable = false, length = 100)
    private String title;

    // 산책 일정 설명
    @Column(length = 1000)
    private String description;

    // 산책 지역
    @Column(nullable = false, length = 100)
    private String region;

    // 만남 장소
    @Column(nullable = false, length = 200)
    private String meetingPlace;

    // 위도
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    // 경도
    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    // 산책 예정 일시
    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    // 예상 산책 시간(분)
    private Integer expectedDurationMinutes;

    // 최대 참여 인원
    @Column(nullable = false)
    private Integer maxParticipants;

    // 선호 반려견 크기
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreferredDogSize preferredDogSize;

    // 선호 반려견 성향
    @Column(length = 200)
    private String preferredPersonality;

    // 산책 일정 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WalkScheduleStatus status;

    // 산책 일정 생성
    private WalkSchedule(
            Member hostMember,
            Dog hostDog,
            String title,
            String description,
            String region,
            String meetingPlace,
            BigDecimal latitude,
            BigDecimal longitude,
            LocalDateTime scheduledAt,
            Integer expectedDurationMinutes,
            Integer maxParticipants,
            PreferredDogSize preferredDogSize,
            String preferredPersonality
    ) {
        this.hostMember = hostMember;
        this.hostDog = hostDog;
        this.title = title;
        this.description = description;
        this.region = region;
        this.meetingPlace = meetingPlace;
        this.latitude = latitude;
        this.longitude = longitude;
        this.scheduledAt = scheduledAt;
        this.expectedDurationMinutes = expectedDurationMinutes;
        this.maxParticipants = maxParticipants == null ? 4 : maxParticipants;
        this.preferredDogSize = preferredDogSize == null ? PreferredDogSize.ANY : preferredDogSize;
        this.preferredPersonality = preferredPersonality;
        this.status = WalkScheduleStatus.OPEN;
    }

    // 산책 일정 생성
    public static WalkSchedule create(
            Member hostMember,
            Dog hostDog,
            String title,
            String description,
            String region,
            String meetingPlace,
            BigDecimal latitude,
            BigDecimal longitude,
            LocalDateTime scheduledAt,
            Integer expectedDurationMinutes,
            Integer maxParticipants,
            PreferredDogSize preferredDogSize,
            String preferredPersonality
    ) {
        return new WalkSchedule(
                hostMember,
                hostDog,
                title,
                description,
                region,
                meetingPlace,
                latitude,
                longitude,
                scheduledAt,
                expectedDurationMinutes,
                maxParticipants,
                preferredDogSize,
                preferredPersonality
        );
    }

    // 산책 일정 수정
    public void update(
            Dog hostDog,
            String title,
            String description,
            String region,
            String meetingPlace,
            BigDecimal latitude,
            BigDecimal longitude,
            LocalDateTime scheduledAt,
            Integer expectedDurationMinutes,
            Integer maxParticipants,
            PreferredDogSize preferredDogSize,
            String preferredPersonality
    ) {
        if (hostDog != null) {
            this.hostDog = hostDog;
        }
        if (title != null) {
            this.title = title;
        }
        if (description != null) {
            this.description = description;
        }
        if (region != null) {
            this.region = region;
        }
        if (meetingPlace != null) {
            this.meetingPlace = meetingPlace;
        }
        if (latitude != null) {
            this.latitude = latitude;
        }
        if (longitude != null) {
            this.longitude = longitude;
        }
        if (scheduledAt != null) {
            this.scheduledAt = scheduledAt;
        }
        if (expectedDurationMinutes != null) {
            this.expectedDurationMinutes = expectedDurationMinutes;
        }
        if (maxParticipants != null) {
            this.maxParticipants = maxParticipants;
        }
        if (preferredDogSize != null) {
            this.preferredDogSize = preferredDogSize;
        }
        if (preferredPersonality != null) {
            this.preferredPersonality = preferredPersonality;
        }
    }

    // 산책 일정 취소
    public void cancel() {
        this.status = WalkScheduleStatus.CANCELED;
    }

    // 모집 마감
    public void close() {
        this.status = WalkScheduleStatus.CLOSED;
    }

    // 모집 재개
    public void reopen() {
        this.status = WalkScheduleStatus.OPEN;
    }

    // 산책 완료
    public void complete() {
        this.status = WalkScheduleStatus.COMPLETED;
    }
}
