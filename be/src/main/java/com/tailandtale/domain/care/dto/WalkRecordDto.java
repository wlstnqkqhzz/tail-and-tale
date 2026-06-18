package com.tailandtale.domain.care.dto;

import com.tailandtale.domain.care.entity.ConditionAfterWalk;
import com.tailandtale.domain.care.entity.WalkRecord;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// 산책 기록 요청 및 응답 DTO 정의 클래스

public class WalkRecordDto {

    // 산책 기록 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "반려견 선택은 필수입니다.")
        private Long dogId;

        private Long walkScheduleId;

        @NotNull(message = "산책 시작 시간은 필수입니다.")
        @PastOrPresent(message = "산책 시작 시간은 미래일 수 없습니다.")
        private LocalDateTime startedAt;

        @PastOrPresent(message = "산책 종료 시간은 미래일 수 없습니다.")
        private LocalDateTime endedAt;

        @Min(value = 1, message = "산책 시간은 1분 이상이어야 합니다.")
        private Integer durationMinutes;

        @DecimalMin(value = "0.01", message = "산책 거리는 0보다 커야 합니다.")
        @DecimalMax(value = "9999.99", message = "산책 거리는 9999.99km 이하로 입력해주세요.")
        private BigDecimal distanceKm;

        private String routeSummary;
        private String memo;
        private ConditionAfterWalk conditionAfterWalk;
    }

    // 산책 기록 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        private Long dogId;
        private Long walkScheduleId;

        @PastOrPresent(message = "산책 시작 시간은 미래일 수 없습니다.")
        private LocalDateTime startedAt;

        @PastOrPresent(message = "산책 종료 시간은 미래일 수 없습니다.")
        private LocalDateTime endedAt;

        @Min(value = 1, message = "산책 시간은 1분 이상이어야 합니다.")
        private Integer durationMinutes;

        @DecimalMin(value = "0.01", message = "산책 거리는 0보다 커야 합니다.")
        @DecimalMax(value = "9999.99", message = "산책 거리는 9999.99km 이하로 입력해주세요.")
        private BigDecimal distanceKm;

        private String routeSummary;
        private String memo;
        private ConditionAfterWalk conditionAfterWalk;
    }

    // 산책 기록 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long walkRecordId;
        private Long memberId;
        private Long dogId;
        private String dogName;
        private Long walkScheduleId;
        private String walkScheduleTitle;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private Integer durationMinutes;
        private BigDecimal distanceKm;
        private String routeSummary;
        private String memo;
        private ConditionAfterWalk conditionAfterWalk;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(WalkRecord walkRecord) {
            return Response.builder()
                    .walkRecordId(walkRecord.getId())
                    .memberId(walkRecord.getMember().getId())
                    .dogId(walkRecord.getDog().getId())
                    .dogName(walkRecord.getDog().getName())
                    .walkScheduleId(walkRecord.getWalkSchedule() == null ? null : walkRecord.getWalkSchedule().getId())
                    .walkScheduleTitle(walkRecord.getWalkSchedule() == null ? null : walkRecord.getWalkSchedule().getTitle())
                    .startedAt(walkRecord.getStartedAt())
                    .endedAt(walkRecord.getEndedAt())
                    .durationMinutes(walkRecord.getDurationMinutes())
                    .distanceKm(walkRecord.getDistanceKm())
                    .routeSummary(walkRecord.getRouteSummary())
                    .memo(walkRecord.getMemo())
                    .conditionAfterWalk(walkRecord.getConditionAfterWalk())
                    .createdAt(walkRecord.getCreatedAt())
                    .updatedAt(walkRecord.getUpdatedAt())
                    .build();
        }
    }

    // 산책 기록 통계 응답 DTO
    @Getter
    @Builder
    public static class SummaryResponse {

        private Long totalCount;
        private Integer totalDurationMinutes;
        private Double averageDurationMinutes;
        private BigDecimal totalDistanceKm;
        private ConditionAfterWalk latestConditionAfterWalk;
        private LocalDate latestWalkDate;
    }
}
