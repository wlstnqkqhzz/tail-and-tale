package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.dto.AiAnalysisDto;
import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.care.dto.WalkRecordDto;
import com.tailandtale.domain.care.entity.*;
import com.tailandtale.domain.care.repository.AiAnalysisResultRepository;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.global.exception.CareErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// AI 분석 Service

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AiAnalysisService {
    private final AiAnalysisResultRepository aiAnalysisResultRepository;
    private final DogRepository dogRepository;
    private final MemberRepository memberRepository;
    private final EmotionDiaryService emotionDiaryService;
    private final HealthRecordService healthRecordService;
    private final WalkRecordService walkRecordService;
    private final AiAnalysisPromptBuilder aiAnalysisPromptBuilder;
    private final AiAnalysisClient aiAnalysisClient;

    // AI 분석 생성
    @Transactional
    public AiAnalysisDto.Response createAnalysis(Long memberId, AiAnalysisDto.CreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
        Dog dog = getMyDog(memberId, request.getDogId());
        LocalDate endDate = request.getTargetEndDate() == null ? LocalDate.now() : request.getTargetEndDate();
        LocalDate startDate = request.getTargetStartDate() == null ? endDate.minusDays(29) : request.getTargetStartDate();

        EmotionDiaryDto.SummaryResponse emotionSummary = emotionDiaryService.getEmotionSummary(
                memberId,
                dog.getId(),
                startDate,
                endDate
        );
        HealthRecordDto.SummaryResponse healthSummary = healthRecordService.getHealthSummary(
                memberId,
                dog.getId(),
                startDate,
                endDate
        );
        WalkRecordDto.SummaryResponse walkSummary = walkRecordService.getWalkSummary(
                memberId,
                dog.getId(),
                startDate,
                endDate
        );
        List<WalkRecordDto.Response> recentWalkRecords = walkRecordService.getMyWalkRecords(memberId, dog.getId());
        List<EmotionDiaryDto.Response> recentEmotionDiaries = emotionDiaryService.getMyEmotionDiaries(memberId, dog.getId());
        List<HealthRecordDto.Response> recentHealthRecords = healthRecordService.getMyHealthRecords(memberId, dog.getId());
        RiskLevel riskLevel = determineRiskLevel(emotionSummary, healthSummary, walkSummary);

        AiGeneratedAnalysis generatedAnalysis = generateAnalysisWithFallback(
                dog,
                request.getAnalysisType(),
                startDate,
                endDate,
                emotionSummary,
                healthSummary,
                walkSummary,
                recentWalkRecords,
                recentEmotionDiaries,
                recentHealthRecords
        );

        AiAnalysisResult aiAnalysisResult = AiAnalysisResult.create(
                dog,
                member,
                request.getAnalysisType(),
                startDate,
                endDate,
                generatedAnalysis.summary(),
                generatedAnalysis.resultContent(),
                riskLevel,
                generatedAnalysis.guideContent()
        );

        aiAnalysisResultRepository.deleteAllByDog_IdAndMember_IdAndAnalysisTypeAndTargetStartDateAndTargetEndDate(
                dog.getId(),
                memberId,
                request.getAnalysisType(),
                startDate,
                endDate
        );

        return AiAnalysisDto.Response.from(aiAnalysisResultRepository.save(aiAnalysisResult));
    }

    // AI 분석 결과 목록 조회
    public List<AiAnalysisDto.Response> getMyAnalyses(Long memberId, Long dogId) {
        List<AiAnalysisResult> aiAnalysisResults = dogId == null
                ? aiAnalysisResultRepository.findAllByMember_IdOrderByCreatedAtDesc(memberId)
                : aiAnalysisResultRepository.findAllByDog_IdAndMember_IdOrderByCreatedAtDesc(dogId, memberId);

        return aiAnalysisResults.stream()
                .map(AiAnalysisDto.Response::from)
                .toList();
    }

    // AI 분석 결과 상세 조회
    public AiAnalysisDto.Response getMyAnalysis(Long memberId, Long aiAnalysisResultId) {
        AiAnalysisResult aiAnalysisResult = aiAnalysisResultRepository.findByIdAndMember_Id(aiAnalysisResultId, memberId)
                .orElseThrow(() -> new CustomException(CareErrorCode.AI_ANALYSIS_NOT_FOUND));

        return AiAnalysisDto.Response.from(aiAnalysisResult);
    }

    // 케어 요약 조회
    public AiAnalysisDto.CareSummaryResponse getCareSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        LocalDate targetEndDate = endDate == null ? LocalDate.now() : endDate;
        LocalDate targetStartDate = startDate == null ? targetEndDate.minusDays(29) : startDate;

        return AiAnalysisDto.CareSummaryResponse.builder()
                .emotionSummary(emotionDiaryService.getEmotionSummary(memberId, dogId, targetStartDate, targetEndDate))
                .healthSummary(healthRecordService.getHealthSummary(memberId, dogId, targetStartDate, targetEndDate))
                .walkSummary(walkRecordService.getWalkSummary(memberId, dogId, targetStartDate, targetEndDate))
                .trend(getCareTrend(memberId, dogId, targetStartDate, targetEndDate))
                .build();
    }

    // 케어 그래프 추세 조회
    private AiAnalysisDto.CareTrendResponse getCareTrend(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<WalkRecord> walkRecords = walkRecordService.getWalkRecordsForSummary(memberId, dogId, startDate, endDate);
        List<EmotionDiary> emotionDiaries = emotionDiaryService.getEmotionDiariesForSummary(memberId, dogId, startDate, endDate);
        List<HealthRecord> healthRecords = healthRecordService.getHealthRecordsForSummary(memberId, dogId, startDate, endDate);
        Map<LocalDate, List<WalkRecord>> walkRecordsByDate = walkRecords.stream()
                .collect(Collectors.groupingBy(walkRecord -> walkRecord.getStartedAt().toLocalDate()));
        Map<LocalDate, EmotionDiary> emotionDiaryByDate = emotionDiaries.stream()
                .collect(Collectors.toMap(
                        EmotionDiary::getRecordedDate,
                        emotionDiary -> emotionDiary,
                        (currentDiary, nextDiary) -> currentDiary
                ));
        Map<LocalDate, HealthRecord> healthRecordByDate = healthRecords.stream()
                .collect(Collectors.toMap(
                        HealthRecord::getRecordedDate,
                        healthRecord -> healthRecord,
                        (currentRecord, nextRecord) -> currentRecord
                ));

        return AiAnalysisDto.CareTrendResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .walkTrend(startDate.datesUntil(endDate.plusDays(1))
                        .map(date -> toDailyWalkTrend(date, walkRecordsByDate.getOrDefault(date, List.of())))
                        .toList())
                .emotionTrend(startDate.datesUntil(endDate.plusDays(1))
                        .map(date -> toDailyEmotionTrend(date, emotionDiaryByDate.get(date)))
                        .toList())
                .healthTrend(startDate.datesUntil(endDate.plusDays(1))
                        .map(date -> toDailyHealthTrend(date, healthRecordByDate.get(date)))
                        .toList())
                .build();
    }

    // 일자별 산책 추세 생성
    private AiAnalysisDto.DailyWalkTrend toDailyWalkTrend(LocalDate date, List<WalkRecord> walkRecords) {
        Integer totalDurationMinutes = walkRecords.stream()
                .map(WalkRecord::getDurationMinutes)
                .filter(durationMinutes -> durationMinutes != null)
                .reduce(0, Integer::sum);
        BigDecimal totalDistanceKm = walkRecords.stream()
                .map(WalkRecord::getDistanceKm)
                .filter(distanceKm -> distanceKm != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AiAnalysisDto.DailyWalkTrend.builder()
                .date(date)
                .count((long) walkRecords.size())
                .totalDurationMinutes(totalDurationMinutes)
                .totalDistanceKm(totalDistanceKm)
                .build();
    }

    // 일자별 감정 추세 생성
    private AiAnalysisDto.DailyEmotionTrend toDailyEmotionTrend(LocalDate date, EmotionDiary emotionDiary) {
        return AiAnalysisDto.DailyEmotionTrend.builder()
                .date(date)
                .emotion(emotionDiary == null ? null : emotionDiary.getEmotion())
                .conditionLevel(emotionDiary == null ? null : emotionDiary.getConditionLevel())
                .build();
    }

    // 일자별 건강 추세 생성
    private AiAnalysisDto.DailyHealthTrend toDailyHealthTrend(LocalDate date, HealthRecord healthRecord) {
        return AiAnalysisDto.DailyHealthTrend.builder()
                .date(date)
                .weight(healthRecord == null ? null : healthRecord.getWeight())
                .healthStatus(healthRecord == null ? null : healthRecord.getHealthStatus())
                .build();
    }

    // 최근 AI 분석 결과 조회
    public List<AiAnalysisDto.Response> getRecentAnalyses(Long memberId) {
        return aiAnalysisResultRepository.findTop5ByMember_IdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(AiAnalysisDto.Response::from)
                .toList();
    }

    // 내 반려견 Entity 조회
    private Dog getMyDog(Long memberId, Long dogId) {
        Dog dog = dogRepository.findByIdAndMemberId(dogId, memberId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));

        validateVerifiedDog(dog);

        return dog;
    }

    // 반려견 인증 여부 검증
    private void validateVerifiedDog(Dog dog) {
        if (!Boolean.TRUE.equals(dog.getIsVerified())) {
            throw new CustomException(DogErrorCode.DOG_NOT_VERIFIED);
        }
    }

    // Gemini 분석 생성 및 fallback 처리
    private AiGeneratedAnalysis generateAnalysisWithFallback(
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
        try {
            String prompt = aiAnalysisPromptBuilder.build(
                    dog,
                    analysisType,
                    startDate,
                    endDate,
                    emotionSummary,
                    healthSummary,
                    walkSummary,
                    walkRecords,
                    emotionDiaries,
                    healthRecords
            );

            return aiAnalysisClient.analyze(prompt);
        } catch (Exception e) {
            log.warn("Gemini analysis failed. fallback analysis will be used. dogId={}, analysisType={}, startDate={}, endDate={}",
                    dog.getId(), analysisType, startDate, endDate, e);
            return generateFallbackAnalysis(
                    dog,
                    analysisType,
                    startDate,
                    endDate,
                    emotionSummary,
                    healthSummary,
                    walkSummary
            );
        }
    }

    // 규칙 기반 fallback 분석 생성
    private AiGeneratedAnalysis generateFallbackAnalysis(
            Dog dog,
            AnalysisType analysisType,
            LocalDate startDate,
            LocalDate endDate,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        RiskLevel riskLevel = determineRiskLevel(emotionSummary, healthSummary, walkSummary);
        String reportType = getReportType(startDate, endDate);
        String summary = createSummary(dog, analysisType, reportType, emotionSummary, healthSummary, walkSummary, riskLevel);
        String resultContent = createResultContent(emotionSummary, healthSummary, walkSummary);
        String guideContent = createGuideContent(riskLevel, emotionSummary, healthSummary, walkSummary);

        return new AiGeneratedAnalysis(
                summary,
                createReviewReport(reportType, emotionSummary, healthSummary, walkSummary, riskLevel, resultContent, guideContent),
                riskLevel,
                guideContent
        );
    }

    // 위험도 계산
    private RiskLevel determineRiskLevel(
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        long badHealthCount = healthSummary.getBadCount() == null ? 0 : healthSummary.getBadCount();
        long watchHealthCount = healthSummary.getWatchCount() == null ? 0 : healthSummary.getWatchCount();
        Double averageConditionLevel = emotionSummary.getAverageConditionLevel();
        ConditionAfterWalk latestConditionAfterWalk = walkSummary.getLatestConditionAfterWalk();

        if (badHealthCount > 0
                || latestConditionAfterWalk == ConditionAfterWalk.BAD
                || (averageConditionLevel != null && averageConditionLevel <= 2.0)) {
            return RiskLevel.HIGH;
        }
        if (watchHealthCount > 0
                || latestConditionAfterWalk == ConditionAfterWalk.TIRED
                || (averageConditionLevel != null && averageConditionLevel <= 3.0)) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }

    // 분석 요약 생성
    private String createSummary(
            Dog dog,
            AnalysisType analysisType,
            String reportType,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary,
            RiskLevel riskLevel
    ) {
        return switch (analysisType) {
            case EMOTION_PATTERN -> dog.getName() + "의 최근 감정 흐름은 "
                    + getEmotionText(emotionSummary.getMostFrequentEmotion()) + " 중심이며 위험도는 " + getRiskText(riskLevel) + "입니다.";
            case HEALTH_RISK -> dog.getName() + "의 건강 기록 기준 위험도는 " + getRiskText(riskLevel) + "입니다.";
            case CARE_GUIDE -> dog.getName() + " " + reportType + " 결산 리포트가 생성되었습니다.";
            case WALK_ACTIVITY -> dog.getName() + "의 최근 산책은 총 " + walkSummary.getTotalCount()
                    + "회, " + walkSummary.getTotalDistanceKm() + "km 기록되었습니다.";
        };
    }

    // 분석 상세 생성
    private String createResultContent(
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        return "산책 기록 " + walkSummary.getTotalCount() + "건, 감정 기록 " + emotionSummary.getTotalCount()
                + "건, 건강 기록 " + healthSummary.getTotalCount()
                + "건을 기준으로 분석했습니다. 평균 컨디션은 "
                + (emotionSummary.getAverageConditionLevel() == null ? "아직 부족합니다" : String.format("%.1f점", emotionSummary.getAverageConditionLevel()))
                + "이며, 총 산책 시간은 " + walkSummary.getTotalDurationMinutes()
                + "분, 총 산책 거리는 " + walkSummary.getTotalDistanceKm()
                + "km입니다. 관찰 필요 건강 기록은 " + healthSummary.getWatchCount()
                + "건, 나쁨 기록은 " + healthSummary.getBadCount() + "건입니다.";
    }

    // 관리 가이드 생성
    private String createGuideContent(
            RiskLevel riskLevel,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        if (riskLevel == RiskLevel.HIGH) {
            return "컨디션 저하 또는 나쁨 건강 기록이 확인되었습니다. 산책 강도를 낮추고 증상이 이어지면 병원 방문을 고려해주세요.";
        }
        if (riskLevel == RiskLevel.MEDIUM) {
            return "관찰이 필요한 변화가 있습니다. 산책 시간과 거리, 식욕, 수면, 산책 후 피로도를 며칠 더 기록해보세요.";
        }
        return "현재 기록상 큰 이상 신호는 낮습니다. 지금처럼 산책, 감정, 건강 기록을 꾸준히 남겨주세요.";
    }

    // 결산 리포트 형식 생성
    private String createReviewReport(
            String reportType,
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary,
            RiskLevel riskLevel,
            String resultContent,
            String guideContent
    ) {
        String conditionText = emotionSummary.getAverageConditionLevel() == null
                ? "아직 평균 컨디션을 판단할 기록이 충분하지 않습니다."
                : String.format("평균 컨디션은 %.1f점입니다.", emotionSummary.getAverageConditionLevel());
        String walkText = walkSummary.getTotalCount() == null || walkSummary.getTotalCount() == 0
                ? "산책 기록은 아직 없습니다."
                : "산책 기록은 " + walkSummary.getTotalCount() + "건, 총 "
                + (walkSummary.getTotalDurationMinutes() == null ? 0 : walkSummary.getTotalDurationMinutes()) + "분입니다.";
        String healthText = healthSummary.getBadCount() != null && healthSummary.getBadCount() > 0
                ? "나쁨으로 기록된 건강 체크가 있어 상태 변화를 천천히 살펴봐주세요."
                : "건강 기록상 큰 이상 신호는 낮습니다.";

        return """
                1. %s 컨디션 요약
                %s %s

                2. 주목할 만한 패턴
                %s

                3. 좋아하는 활동 추정
                데이터에 명확히 드러난 활동만 보면 산책 후 상태와 메모를 계속 비교해보는 것이 좋습니다.

                4. 관찰 포인트
                %s 위험도는 %s입니다.

                5. 다음 %s 케어 가이드
                %s

                6. 보호자에게 한마디
                지금처럼 짧게라도 꾸준히 기록해주면 다음 결산이 더 정확해집니다.
                """.formatted(
                reportType,
                conditionText,
                walkText,
                resultContent,
                healthText,
                getRiskText(riskLevel),
                reportType,
                guideContent
        ).trim();
    }

    // 결산 단위 계산
    private String getReportType(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return "주간";
        }
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        return days >= 28 ? "월간" : "주간";
    }

    private String getEmotionText(DogEmotion emotion) {
        if (emotion == null) {
            return "아직 충분한 데이터 없음";
        }
        return switch (emotion) {
            case HAPPY -> "기분 좋음";
            case CALM -> "평온함";
            case EXCITED -> "흥분";
            case ANXIOUS -> "불안";
            case SAD -> "슬픔";
            case ANGRY -> "예민함";
            case TIRED -> "피곤함";
            case UNKNOWN -> "알 수 없음";
        };
    }

    private String getRiskText(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> "낮음";
            case MEDIUM -> "보통";
            case HIGH -> "높음";
        };
    }

}
