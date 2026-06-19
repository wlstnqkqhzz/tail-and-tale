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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// AI 분석 Service

@Service
@RequiredArgsConstructor
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
                generatedAnalysis.riskLevel(),
                generatedAnalysis.guideContent()
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
            return generateFallbackAnalysis(
                    dog,
                    analysisType,
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
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary
    ) {
        RiskLevel riskLevel = determineRiskLevel(emotionSummary, healthSummary, walkSummary);
        String summary = createSummary(dog, analysisType, emotionSummary, healthSummary, walkSummary, riskLevel);
        String resultContent = createResultContent(emotionSummary, healthSummary, walkSummary);
        String guideContent = createGuideContent(riskLevel, emotionSummary, healthSummary, walkSummary);

        return new AiGeneratedAnalysis(summary, resultContent, riskLevel, guideContent);
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
            EmotionDiaryDto.SummaryResponse emotionSummary,
            HealthRecordDto.SummaryResponse healthSummary,
            WalkRecordDto.SummaryResponse walkSummary,
            RiskLevel riskLevel
    ) {
        return switch (analysisType) {
            case EMOTION_PATTERN -> dog.getName() + "의 최근 감정 흐름은 "
                    + getEmotionText(emotionSummary.getMostFrequentEmotion()) + " 중심이며 위험도는 " + getRiskText(riskLevel) + "입니다.";
            case HEALTH_RISK -> dog.getName() + "의 건강 기록 기준 위험도는 " + getRiskText(riskLevel) + "입니다.";
            case CARE_GUIDE -> dog.getName() + "에게 필요한 관리 가이드를 생성했습니다.";
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
