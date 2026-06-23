package com.tailandtale.domain.care.dto;

import com.tailandtale.domain.care.entity.AiAnalysisResult;
import com.tailandtale.domain.care.entity.AnalysisType;
import com.tailandtale.domain.care.entity.DogEmotion;
import com.tailandtale.domain.care.entity.HealthStatus;
import com.tailandtale.domain.care.entity.RiskLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// AI 분석 요청 및 응답 DTO 정의 클래스

public class AiAnalysisDto {

    // AI 분석 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "반려견 선택은 필수입니다.")
        private Long dogId;

        @NotNull(message = "분석 유형은 필수입니다.")
        private AnalysisType analysisType;

        private LocalDate targetStartDate;
        private LocalDate targetEndDate;
    }

    // AI 분석 결과 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long aiAnalysisResultId;
        private Long dogId;
        private String dogName;
        private Long memberId;
        private AnalysisType analysisType;
        private LocalDate targetStartDate;
        private LocalDate targetEndDate;
        private String summary;
        private String resultContent;
        private RiskLevel riskLevel;
        private String guideContent;
        private LocalDateTime createdAt;

        public static Response from(AiAnalysisResult aiAnalysisResult) {
            return Response.builder()
                    .aiAnalysisResultId(aiAnalysisResult.getId())
                    .dogId(aiAnalysisResult.getDog().getId())
                    .dogName(aiAnalysisResult.getDog().getName())
                    .memberId(aiAnalysisResult.getMember().getId())
                    .analysisType(aiAnalysisResult.getAnalysisType())
                    .targetStartDate(aiAnalysisResult.getTargetStartDate())
                    .targetEndDate(aiAnalysisResult.getTargetEndDate())
                    .summary(aiAnalysisResult.getSummary())
                    .resultContent(aiAnalysisResult.getResultContent())
                    .riskLevel(aiAnalysisResult.getRiskLevel())
                    .guideContent(aiAnalysisResult.getGuideContent())
                    .createdAt(aiAnalysisResult.getCreatedAt())
                    .build();
        }
    }

    // 케어 요약 응답 DTO
    @Getter
    @Builder
    public static class CareSummaryResponse {

        private EmotionDiaryDto.SummaryResponse emotionSummary;
        private HealthRecordDto.SummaryResponse healthSummary;
        private WalkRecordDto.SummaryResponse walkSummary;
        private CareTrendResponse trend;
    }

    // 케어 그래프 추세 응답 DTO
    @Getter
    @Builder
    public static class CareTrendResponse {

        private LocalDate startDate;
        private LocalDate endDate;
        private List<DailyWalkTrend> walkTrend;
        private List<DailyEmotionTrend> emotionTrend;
        private List<DailyHealthTrend> healthTrend;
    }

    // 일자별 산책 추세 DTO
    @Getter
    @Builder
    public static class DailyWalkTrend {

        private LocalDate date;
        private Long count;
        private Integer totalDurationMinutes;
        private BigDecimal totalDistanceKm;
    }

    // 일자별 감정 추세 DTO
    @Getter
    @Builder
    public static class DailyEmotionTrend {

        private LocalDate date;
        private DogEmotion emotion;
        private Integer conditionLevel;
    }

    // 일자별 건강 추세 DTO
    @Getter
    @Builder
    public static class DailyHealthTrend {

        private LocalDate date;
        private BigDecimal weight;
        private HealthStatus healthStatus;
    }
}
