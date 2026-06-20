package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.care.dto.WalkRecordDto;
import com.tailandtale.domain.care.entity.AnalysisType;
import com.tailandtale.domain.care.entity.ConditionAfterWalk;
import com.tailandtale.domain.care.entity.DogEmotion;
import com.tailandtale.domain.care.entity.HealthStatus;
import com.tailandtale.domain.dog.entity.Dog;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

// AI 분석 프롬프트 생성기

@Component
public class AiAnalysisPromptBuilder {

    // 케어 분석 프롬프트 생성
    public String build(
            Dog dog,
            AnalysisType analysisType,
            LocalDate startDate,
            LocalDate endDate,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary,
            List<WalkRecordDto.Response> walkRecords,
            List<EmotionDiaryDto.Response> emotionDiaries,
            List<HealthRecordDto.Response> healthRecords
    ) {
        String reportType = resolveReportType(startDate, endDate);
        String periodText = reportType.equals("월간") ? "달" : "주";
        StringBuilder prompt = new StringBuilder();

            prompt.append("""
            너는 반려견 행동 분석 전문가다.
    
            주어진 산책 기록, 감정 일기, 건강 기록을 분석하여 보호자가 읽기 쉬운 %s 결산 리포트를 작성하라.
    
            반드시 아래 Markdown 형식을 그대로 지켜라.
    
            ## 📊 %s 컨디션 요약
    
            - **평균 컨디션**:
            - **주요 감정**:
            - **산책 횟수**:
            - **건강 상태**:
    
            ## 🔍 이번 %s 발견된 패턴
    
            - **패턴 1**:
            - **패턴 2**:
            - **패턴 3**:
    
            ## ❤️ 좋아하는 활동 추정
    
            - **활동 1**:
            - **활동 2**:
    
            ## ⚠️ 관찰 포인트
    
            - **주의할 점**:
            - **이상 신호 여부**:
    
            ## 📅 다음 %s 추천
    
            1.
            2.
            3.
    
            ## 💌 보호자에게 한마디
    
            2~3문장으로 따뜻하게 작성한다.
    
            규칙
            - HTML 금지
            - JSON 금지
            - 코드블록 금지
            - 각 섹션 제목은 반드시 ## 로 시작할 것
            - 중요한 키워드는 **굵게** 표시할 것
            - 긴 문단 금지
            - 각 섹션은 3~5줄 이내
            - 데이터에 없는 내용은 추측하지 말 것
    
            """.formatted(reportType, reportType, periodText, periodText));

        prompt.append("[분석 대상]\n")
                .append("- 반려견 이름: ").append(dog.getName()).append("\n")
                .append("- 견종: ").append(nullToDash(dog.getBreed())).append("\n")
                .append("- 크기: ").append(nullToDash(dog.getSize())).append("\n")
                .append("- 몸무게: ").append(nullToDash(dog.getWeight())).append("kg\n")
                .append("- 분석 유형: ").append(toAnalysisText(analysisType)).append("\n")
                .append("- 리포트 유형: ").append(reportType).append(" 결산\n")
                .append("- 분석 기간: ").append(startDate).append(" ~ ").append(endDate).append("\n\n");

        appendSummary(prompt, emotionSummary, healthSummary, walkSummary);
        appendWalkRecords(prompt, walkRecords);
        appendEmotionDiaries(prompt, emotionDiaries);
        appendHealthRecords(prompt, healthRecords);

        return prompt.toString();
    }

    // 요약 데이터 추가
    private void appendSummary(
            StringBuilder prompt,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        prompt.append("[요약 데이터]\n")
                .append("- 산책 기록 수: ").append(walkSummary.getTotalCount()).append("건\n")
                .append("- 총 산책 시간: ").append(walkSummary.getTotalDurationMinutes()).append("분\n")
                .append("- 평균 산책 시간: ").append(nullToDash(walkSummary.getAverageDurationMinutes())).append("분\n")
                .append("- 총 산책 거리: ").append(nullToDash(walkSummary.getTotalDistanceKm())).append("km\n")
                .append("- 최근 산책 후 상태: ").append(toConditionAfterWalkText(walkSummary.getLatestConditionAfterWalk())).append("\n")
                .append("- 감정 기록 수: ").append(emotionSummary.getTotalCount()).append("건\n")
                .append("- 평균 컨디션 점수: ").append(nullToDash(emotionSummary.getAverageConditionLevel())).append("\n")
                .append("- 가장 많은 감정: ").append(toEmotionText(emotionSummary.getMostFrequentEmotion())).append("\n")
                .append("- 감정 분포: ").append(toEmotionCountsText(emotionSummary.getEmotionCounts())).append("\n")
                .append("- 건강 기록 수: ").append(healthSummary.getTotalCount()).append("건\n")
                .append("- 최근 몸무게: ").append(nullToDash(healthSummary.getLatestWeight())).append("kg\n")
                .append("- 몸무게 변화: ").append(nullToDash(healthSummary.getWeightChange())).append("kg\n")
                .append("- 관찰 필요 기록 수: ").append(healthSummary.getWatchCount()).append("건\n")
                .append("- 나쁨 기록 수: ").append(healthSummary.getBadCount()).append("건\n\n");
    }

    // 산책 기록 추가
    private void appendWalkRecords(StringBuilder prompt, List<WalkRecordDto.Response> records) {
        prompt.append("[산책 기록]\n");

        if (records.isEmpty()) {
            prompt.append("- 없음\n\n");
            return;
        }

        records.stream().limit(10).forEach(record -> prompt
                .append("- ")
                .append(record.getStartedAt() == null ? "-" : record.getStartedAt().toLocalDate())
                .append(" / ")
                .append(nullToDash(record.getDurationMinutes())).append("분 / ")
                .append(nullToDash(record.getDistanceKm())).append("km / 산책 후 상태 ")
                .append(toConditionAfterWalkText(record.getConditionAfterWalk()))
                .append(" / 메모: ").append(nullToDash(firstText(record.getMemo(), record.getRouteSummary())))
                .append("\n"));

        prompt.append("\n");
    }

    // 감정 일기 추가
    private void appendEmotionDiaries(StringBuilder prompt, List<EmotionDiaryDto.Response> diaries) {
        prompt.append("[감정 일기]\n");

        if (diaries.isEmpty()) {
            prompt.append("- 없음\n\n");
            return;
        }

        diaries.stream().limit(10).forEach(diary -> prompt
                .append("- ")
                .append(diary.getRecordedDate())
                .append(" / 감정 ").append(toEmotionText(diary.getEmotion()))
                .append(" / 컨디션 ").append(nullToDash(diary.getConditionLevel()))
                .append(" / 행동: ").append(nullToDash(diary.getBehaviorPattern()))
                .append(" / 내용: ").append(nullToDash(diary.getDiaryContent()))
                .append("\n"));

        prompt.append("\n");
    }

    // 건강 기록 추가
    private void appendHealthRecords(StringBuilder prompt, List<HealthRecordDto.Response> records) {
        prompt.append("[건강 기록]\n");

        if (records.isEmpty()) {
            prompt.append("- 없음\n\n");
            return;
        }

        records.stream().limit(10).forEach(record -> prompt
                .append("- ")
                .append(record.getRecordedDate())
                .append(" / 상태 ").append(toHealthText(record.getHealthStatus()))
                .append(" / 몸무게 ").append(nullToDash(record.getWeight())).append("kg")
                .append(" / 증상: ").append(nullToDash(record.getSymptoms()))
                .append(" / 메모: ").append(nullToDash(record.getMemo()))
                .append("\n"));

        prompt.append("\n");
    }

    private String resolveReportType(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return "주간";
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        return days >= 28 ? "월간" : "주간";
    }

    private String toAnalysisText(AnalysisType analysisType) {
        return switch (analysisType) {
            case WALK_ACTIVITY -> "산책 활동 분석";
            case EMOTION_PATTERN -> "감정 패턴 분석";
            case HEALTH_RISK -> "건강 위험 분석";
            case CARE_GUIDE -> "맞춤 관리 가이드";
        };
    }

    private String toConditionAfterWalkText(ConditionAfterWalk condition) {
        if (condition == null) {
            return "-";
        }

        return switch (condition) {
            case VERY_GOOD -> "매우 좋음";
            case GOOD -> "좋음";
            case NORMAL -> "보통";
            case TIRED -> "피곤함";
            case BAD -> "나쁨";
        };
    }

    private String toEmotionText(DogEmotion emotion) {
        if (emotion == null) {
            return "-";
        }

        return switch (emotion) {
            case HAPPY -> "기분 좋음";
            case CALM -> "평온함";
            case EXCITED -> "신남";
            case ANXIOUS -> "불안함";
            case SAD -> "슬픔";
            case ANGRY -> "화남";
            case TIRED -> "피곤함";
            case UNKNOWN -> "알 수 없음";
        };
    }

    private String toHealthText(HealthStatus healthStatus) {
        if (healthStatus == null) {
            return "-";
        }

        return switch (healthStatus) {
            case VERY_GOOD -> "매우 좋음";
            case GOOD -> "좋음";
            case NORMAL -> "보통";
            case WATCH -> "관찰 필요";
            case BAD -> "나쁨";
        };
    }

    private String toEmotionCountsText(Map<DogEmotion, Long> emotionCounts) {
        if (emotionCounts == null || emotionCounts.isEmpty()) {
            return "-";
        }

        StringBuilder builder = new StringBuilder();
        emotionCounts.forEach((emotion, count) -> builder
                .append(toEmotionText(emotion))
                .append(" ")
                .append(count)
                .append("건, "));

        return builder.substring(0, builder.length() - 2);
    }

    private String firstText(String first, String second) {
        return first == null || first.isBlank() ? second : first;
    }

    private String nullToDash(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }
}
