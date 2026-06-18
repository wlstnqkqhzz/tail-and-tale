package com.tailandtale.domain.care.dto;

import com.tailandtale.domain.care.entity.DogEmotion;
import com.tailandtale.domain.care.entity.EmotionDiary;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

// 감정 다이어리 요청 및 응답 DTO 정의 클래스

public class EmotionDiaryDto {

    // 감정 다이어리 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "반려견 선택은 필수입니다.")
        private Long dogId;

        private Long walkRecordId;

        @NotNull(message = "기록일은 필수입니다.")
        @PastOrPresent(message = "기록일은 미래 날짜일 수 없습니다.")
        private LocalDate recordedDate;

        private DogEmotion emotion;
        private String behaviorPattern;

        @Min(value = 1, message = "컨디션 점수는 1점 이상이어야 합니다.")
        @Max(value = 5, message = "컨디션 점수는 5점 이하이어야 합니다.")
        private Integer conditionLevel;

        private String diaryContent;
    }

    // 감정 다이어리 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        private Long dogId;
        private Long walkRecordId;

        @PastOrPresent(message = "기록일은 미래 날짜일 수 없습니다.")
        private LocalDate recordedDate;

        private DogEmotion emotion;
        private String behaviorPattern;

        @Min(value = 1, message = "컨디션 점수는 1점 이상이어야 합니다.")
        @Max(value = 5, message = "컨디션 점수는 5점 이하이어야 합니다.")
        private Integer conditionLevel;

        private String diaryContent;
    }

    // 감정 다이어리 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long emotionDiaryId;
        private Long dogId;
        private String dogName;
        private Long walkRecordId;
        private LocalDate recordedDate;
        private DogEmotion emotion;
        private String behaviorPattern;
        private Integer conditionLevel;
        private String diaryContent;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(EmotionDiary emotionDiary) {
            return Response.builder()
                    .emotionDiaryId(emotionDiary.getId())
                    .dogId(emotionDiary.getDog().getId())
                    .dogName(emotionDiary.getDog().getName())
                    .walkRecordId(emotionDiary.getWalkRecordId())
                    .recordedDate(emotionDiary.getRecordedDate())
                    .emotion(emotionDiary.getEmotion())
                    .behaviorPattern(emotionDiary.getBehaviorPattern())
                    .conditionLevel(emotionDiary.getConditionLevel())
                    .diaryContent(emotionDiary.getDiaryContent())
                    .createdAt(emotionDiary.getCreatedAt())
                    .updatedAt(emotionDiary.getUpdatedAt())
                    .build();
        }
    }

    // 감정 통계 응답 DTO
    @Getter
    @Builder
    public static class SummaryResponse {

        private Long totalCount;
        private Double averageConditionLevel;
        private DogEmotion mostFrequentEmotion;
        private Map<DogEmotion, Long> emotionCounts;
    }
}
