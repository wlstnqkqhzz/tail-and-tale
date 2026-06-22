package com.tailandtale.domain.walk.dto;

// 산책 일정 DTO

import com.tailandtale.domain.walk.entity.PreferredDogSize;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WalkScheduleDto {

    // 산책 일정 검색 조건 DTO
    @Getter
    @Setter
    @NoArgsConstructor
    public static class SearchCondition {
        private String keyword;
        private String region;
        private WalkScheduleStatus status;
        private PreferredDogSize preferredDogSize;
        private LocalDateTime scheduledFrom;
        private LocalDateTime scheduledTo;
        private Boolean recruitableOnly;
    }

    // 산책 일정 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "반려견 ID는 필수입니다.")
        private Long dogId;

        @NotBlank(message = "산책 일정 제목은 필수입니다.")
        private String title;

        private String description;

        @NotBlank(message = "산책 지역은 필수입니다.")
        @Pattern(
                regexp = "^([가-힣]+(특별시|광역시|특별자치시|특별자치도|도)\\s[가-힣]+(시|군|구))$",
                message = "산책 지역은 시/도와 시/군/구를 모두 선택해주세요."
        )
        private String region;

        @NotBlank(message = "만남 장소는 필수입니다.")
        private String meetingPlace;

        private BigDecimal latitude;
        private BigDecimal longitude;

        @NotNull(message = "산책 예정 일시는 필수입니다.")
        @Future(message = "산책 예정 일시는 미래 시간이어야 합니다.")
        private LocalDateTime scheduledAt;

        @Min(value = 1, message = "예상 산책 시간은 1분 이상이어야 합니다.")
        private Integer expectedDurationMinutes;

        @Min(value = 1, message = "최대 참여 인원은 1명 이상이어야 합니다.")
        private Integer maxParticipants;

        private PreferredDogSize preferredDogSize;
        private String preferredPersonality;
    }

    // 산책 일정 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        private Long dogId;
        private String title;
        private String description;
        @Pattern(
                regexp = "^([가-힣]+(특별시|광역시|특별자치시|특별자치도|도)\\s[가-힣]+(시|군|구))$",
                message = "산책 지역은 시/도와 시/군/구를 모두 선택해주세요."
        )
        private String region;
        private String meetingPlace;
        private BigDecimal latitude;
        private BigDecimal longitude;

        @Future(message = "산책 예정 일시는 미래 시간이어야 합니다.")
        private LocalDateTime scheduledAt;

        @Min(value = 1, message = "예상 산책 시간은 1분 이상이어야 합니다.")
        private Integer expectedDurationMinutes;

        @Min(value = 1, message = "최대 참여 인원은 1명 이상이어야 합니다.")
        private Integer maxParticipants;

        private PreferredDogSize preferredDogSize;
        private String preferredPersonality;
    }

    // 산책 일정 정보 응답 DTO
    @Getter
    @Builder
    public static class DetailResponse {

        private Long walkScheduleId;
        private Long hostMemberId;
        private Long hostDogId;

        private String title;
        private String description;

        private String region;
        private String meetingPlace;
        private BigDecimal latitude;
        private BigDecimal longitude;

        private LocalDateTime scheduledAt;
        private Integer expectedDurationMinutes;
        private Integer maxParticipants;
        private Long currentParticipantCount;
        private Long approvedParticipantCount;
        private Long pendingRequestCount;

        private PreferredDogSize preferredDogSize;
        private String preferredPersonality;
        private WalkScheduleStatus status;
        private WalkParticipantStatus myParticipantStatus;
        private Boolean isRecruitable;
        private Double averageRating;
        private Long reviewCount;

        public static DetailResponse from(WalkSchedule walkSchedule) {
            return from(
                    walkSchedule,
                    0L,
                    0L,
                    null,
                    0.0,
                    0L
            );
        }

        public static DetailResponse from(
                WalkSchedule walkSchedule,
                long approvedParticipantCount,
                long pendingRequestCount,
                WalkParticipantStatus myParticipantStatus
        ) {
            return from(
                    walkSchedule,
                    approvedParticipantCount,
                    pendingRequestCount,
                    myParticipantStatus,
                    0.0,
                    0L
            );
        }

        public static DetailResponse from(
                WalkSchedule walkSchedule,
                long approvedParticipantCount,
                long pendingRequestCount,
                WalkParticipantStatus myParticipantStatus,
                Double averageRating,
                Long reviewCount
        ) {
            long currentParticipantCount = approvedParticipantCount + 1;
            boolean isRecruitable = walkSchedule.getStatus() == WalkScheduleStatus.OPEN
                    && currentParticipantCount < walkSchedule.getMaxParticipants();

            return DetailResponse.builder()
                    .walkScheduleId(walkSchedule.getId())
                    .hostMemberId(walkSchedule.getHostMember().getId())
                    .hostDogId(walkSchedule.getHostDog().getId())
                    .title(walkSchedule.getTitle())
                    .description(walkSchedule.getDescription())
                    .region(walkSchedule.getRegion())
                    .meetingPlace(walkSchedule.getMeetingPlace())
                    .latitude(walkSchedule.getLatitude())
                    .longitude(walkSchedule.getLongitude())
                    .scheduledAt(walkSchedule.getScheduledAt())
                    .expectedDurationMinutes(walkSchedule.getExpectedDurationMinutes())
                    .maxParticipants(walkSchedule.getMaxParticipants())
                    .currentParticipantCount(currentParticipantCount)
                    .approvedParticipantCount(approvedParticipantCount)
                    .pendingRequestCount(pendingRequestCount)
                    .preferredDogSize(walkSchedule.getPreferredDogSize())
                    .preferredPersonality(walkSchedule.getPreferredPersonality())
                    .status(walkSchedule.getStatus())
                    .myParticipantStatus(myParticipantStatus)
                    .isRecruitable(isRecruitable)
                    .averageRating(averageRating == null ? 0.0 : averageRating)
                    .reviewCount(reviewCount == null ? 0L : reviewCount)
                    .build();
        }
    }
}
