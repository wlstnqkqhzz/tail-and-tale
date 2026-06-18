package com.tailandtale.domain.care.dto;

import com.tailandtale.domain.care.entity.HealthRecord;
import com.tailandtale.domain.care.entity.HealthStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// 건강 기록 요청 및 응답 DTO 정의 클래스

public class HealthRecordDto {

    // 건강 기록 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "반려견 선택은 필수입니다.")
        private Long dogId;

        @NotNull(message = "기록일은 필수입니다.")
        @PastOrPresent(message = "기록일은 미래 날짜일 수 없습니다.")
        private LocalDate recordedDate;

        @DecimalMin(value = "0.01", message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "999.99", message = "몸무게는 999.99kg 이하로 입력해주세요.")
        private BigDecimal weight;

        private HealthStatus healthStatus;
        private String symptoms;
        private String memo;
    }

    // 건강 기록 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        private Long dogId;

        @PastOrPresent(message = "기록일은 미래 날짜일 수 없습니다.")
        private LocalDate recordedDate;

        @DecimalMin(value = "0.01", message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "999.99", message = "몸무게는 999.99kg 이하로 입력해주세요.")
        private BigDecimal weight;

        private HealthStatus healthStatus;
        private String symptoms;
        private String memo;
    }

    // 건강 기록 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long healthRecordId;
        private Long dogId;
        private String dogName;
        private LocalDate recordedDate;
        private BigDecimal weight;
        private HealthStatus healthStatus;
        private String symptoms;
        private String memo;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(HealthRecord healthRecord) {
            return Response.builder()
                    .healthRecordId(healthRecord.getId())
                    .dogId(healthRecord.getDog().getId())
                    .dogName(healthRecord.getDog().getName())
                    .recordedDate(healthRecord.getRecordedDate())
                    .weight(healthRecord.getWeight())
                    .healthStatus(healthRecord.getHealthStatus())
                    .symptoms(healthRecord.getSymptoms())
                    .memo(healthRecord.getMemo())
                    .createdAt(healthRecord.getCreatedAt())
                    .updatedAt(healthRecord.getUpdatedAt())
                    .build();
        }
    }

    // 건강 통계 응답 DTO
    @Getter
    @Builder
    public static class SummaryResponse {

        private Long totalCount;
        private BigDecimal latestWeight;
        private BigDecimal weightChange;
        private Long watchCount;
        private Long badCount;
    }
}
