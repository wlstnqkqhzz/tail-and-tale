package com.tailandtale.domain.care.dto;

import com.tailandtale.domain.care.entity.AiAnalysisResult;
import com.tailandtale.domain.care.entity.AnalysisType;
import com.tailandtale.domain.care.entity.RiskLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    }
}
