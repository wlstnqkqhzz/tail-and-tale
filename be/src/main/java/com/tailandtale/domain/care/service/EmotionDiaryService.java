package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.entity.DogEmotion;
import com.tailandtale.domain.care.entity.EmotionDiary;
import com.tailandtale.domain.care.repository.EmotionDiaryRepository;
import com.tailandtale.domain.care.repository.WalkRecordRepository;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.global.exception.CareErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

// 감정 다이어리 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmotionDiaryService {
    private final EmotionDiaryRepository emotionDiaryRepository;
    private final WalkRecordRepository walkRecordRepository;
    private final DogRepository dogRepository;

    // 감정 다이어리 생성
    @Transactional
    public EmotionDiaryDto.Response createEmotionDiary(Long memberId, EmotionDiaryDto.CreateRequest request) {
        Dog dog = getMyDog(memberId, request.getDogId());
        validateNotDuplicate(dog.getId(), request.getRecordedDate());
        validateWalkRecord(memberId, dog.getId(), request.getWalkRecordId());

        EmotionDiary emotionDiary = EmotionDiary.create(
                dog,
                request.getWalkRecordId(),
                request.getRecordedDate(),
                request.getEmotion(),
                request.getBehaviorPattern(),
                request.getConditionLevel(),
                request.getDiaryContent()
        );

        return EmotionDiaryDto.Response.from(emotionDiaryRepository.save(emotionDiary));
    }

    // 감정 다이어리 목록 조회
    public List<EmotionDiaryDto.Response> getMyEmotionDiaries(Long memberId, Long dogId) {
        List<EmotionDiary> emotionDiaries = dogId == null
                ? emotionDiaryRepository.findAllByDog_Member_IdOrderByRecordedDateDesc(memberId)
                : emotionDiaryRepository.findAllByDog_IdAndDog_Member_IdOrderByRecordedDateDesc(dogId, memberId);

        return emotionDiaries.stream()
                .map(EmotionDiaryDto.Response::from)
                .toList();
    }

    // 감정 다이어리 상세 조회
    public EmotionDiaryDto.Response getMyEmotionDiary(Long memberId, Long emotionDiaryId) {
        return EmotionDiaryDto.Response.from(getMyEmotionDiaryEntity(memberId, emotionDiaryId));
    }

    // 감정 다이어리 수정
    @Transactional
    public EmotionDiaryDto.Response updateEmotionDiary(
            Long memberId,
            Long emotionDiaryId,
            EmotionDiaryDto.UpdateRequest request
    ) {
        EmotionDiary emotionDiary = getMyEmotionDiaryEntity(memberId, emotionDiaryId);
        Dog dog = request.getDogId() == null ? null : getMyDog(memberId, request.getDogId());
        Long targetDogId = dog == null ? emotionDiary.getDog().getId() : dog.getId();
        LocalDate targetRecordedDate = request.getRecordedDate() == null
                ? emotionDiary.getRecordedDate()
                : request.getRecordedDate();

        validateNotDuplicate(targetDogId, targetRecordedDate, emotionDiary.getId());
        validateWalkRecord(memberId, targetDogId, request.getWalkRecordId());

        emotionDiary.update(
                dog,
                request.getWalkRecordId(),
                request.getRecordedDate(),
                request.getEmotion(),
                request.getBehaviorPattern(),
                request.getConditionLevel(),
                request.getDiaryContent()
        );

        return EmotionDiaryDto.Response.from(emotionDiary);
    }

    // 감정 다이어리 삭제
    @Transactional
    public void deleteEmotionDiary(Long memberId, Long emotionDiaryId) {
        EmotionDiary emotionDiary = getMyEmotionDiaryEntity(memberId, emotionDiaryId);

        emotionDiaryRepository.delete(emotionDiary);
    }

    // 감정 통계 조회
    public EmotionDiaryDto.SummaryResponse getEmotionSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<EmotionDiary> emotionDiaries = getEmotionDiariesForSummary(memberId, dogId, startDate, endDate);
        Map<DogEmotion, Long> emotionCounts = new EnumMap<>(DogEmotion.class);

        emotionDiaries.stream()
                .collect(Collectors.groupingBy(EmotionDiary::getEmotion, () -> new EnumMap<>(DogEmotion.class), Collectors.counting()))
                .forEach(emotionCounts::put);

        OptionalDouble averageConditionLevel = emotionDiaries.stream()
                .map(EmotionDiary::getConditionLevel)
                .filter(conditionLevel -> conditionLevel != null)
                .mapToInt(Integer::intValue)
                .average();

        DogEmotion mostFrequentEmotion = emotionCounts.entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        return EmotionDiaryDto.SummaryResponse.builder()
                .totalCount((long) emotionDiaries.size())
                .averageConditionLevel(averageConditionLevel.isPresent() ? averageConditionLevel.getAsDouble() : null)
                .mostFrequentEmotion(mostFrequentEmotion)
                .emotionCounts(emotionCounts)
                .build();
    }

    // 기간별 감정 다이어리 Entity 목록 조회
    public List<EmotionDiary> getEmotionDiariesForSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Dog dog = getMyDog(memberId, dogId);

        return emotionDiaryRepository.findAllByDog_IdAndDog_Member_IdAndRecordedDateBetweenOrderByRecordedDateAsc(
                dog.getId(),
                memberId,
                startDate,
                endDate
        );
    }

    // 최근 감정 다이어리 조회
    public List<EmotionDiaryDto.Response> getRecentEmotionDiaries(Long memberId) {
        return emotionDiaryRepository.findTop5ByDog_Member_IdOrderByRecordedDateDesc(memberId)
                .stream()
                .map(EmotionDiaryDto.Response::from)
                .toList();
    }

    // 내 반려견 Entity 조회
    private Dog getMyDog(Long memberId, Long dogId) {
        return dogRepository.findByIdAndMemberId(dogId, memberId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));
    }

    // 내 감정 다이어리 Entity 조회
    private EmotionDiary getMyEmotionDiaryEntity(Long memberId, Long emotionDiaryId) {
        return emotionDiaryRepository.findByIdAndDog_Member_Id(emotionDiaryId, memberId)
                .orElseThrow(() -> new CustomException(CareErrorCode.EMOTION_DIARY_NOT_FOUND));
    }

    // 산책 기록 연결 검증
    private void validateWalkRecord(Long memberId, Long dogId, Long walkRecordId) {
        if (walkRecordId == null) {
            return;
        }

        walkRecordRepository.findByIdAndDog_IdAndMember_Id(walkRecordId, dogId, memberId)
                .orElseThrow(() -> new CustomException(CareErrorCode.WALK_RECORD_NOT_FOUND));
    }

    // 감정 다이어리 중복 검증
    private void validateNotDuplicate(Long dogId, LocalDate recordedDate) {
        if (emotionDiaryRepository.existsByDog_IdAndRecordedDate(dogId, recordedDate)) {
            throw new CustomException(CareErrorCode.EMOTION_DIARY_ALREADY_EXISTS);
        }
    }

    // 감정 다이어리 중복 검증
    private void validateNotDuplicate(Long dogId, LocalDate recordedDate, Long emotionDiaryId) {
        if (emotionDiaryRepository.existsByDog_IdAndRecordedDateAndIdNot(dogId, recordedDate, emotionDiaryId)) {
            throw new CustomException(CareErrorCode.EMOTION_DIARY_ALREADY_EXISTS);
        }
    }
}
