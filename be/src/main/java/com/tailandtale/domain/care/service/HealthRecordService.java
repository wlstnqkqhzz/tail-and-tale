package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.care.entity.HealthRecord;
import com.tailandtale.domain.care.entity.HealthStatus;
import com.tailandtale.domain.care.repository.HealthRecordRepository;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.service.TrustScoreService;
import com.tailandtale.global.exception.CareErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

// 건강 기록 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthRecordService {
    private final HealthRecordRepository healthRecordRepository;
    private final DogRepository dogRepository;
    private final TrustScoreService trustScoreService;

    // 건강 기록 생성
    @Transactional
    public HealthRecordDto.Response createHealthRecord(Long memberId, HealthRecordDto.CreateRequest request) {
        Dog dog = getMyDog(memberId, request.getDogId());
        validateNotDuplicate(dog.getId(), request.getRecordedDate());

        HealthRecord healthRecord = HealthRecord.create(
                dog,
                request.getRecordedDate(),
                request.getWeight(),
                request.getHealthStatus(),
                request.getSymptoms(),
                request.getMemo()
        );

        HealthRecord savedHealthRecord = healthRecordRepository.save(healthRecord);

        trustScoreService.evaluateBadges(memberId);

        return HealthRecordDto.Response.from(savedHealthRecord);
    }

    // 건강 기록 목록 조회
    public List<HealthRecordDto.Response> getMyHealthRecords(Long memberId, Long dogId) {
        List<HealthRecord> healthRecords = dogId == null
                ? healthRecordRepository.findAllByDog_Member_IdOrderByRecordedDateDesc(memberId)
                : healthRecordRepository.findAllByDog_IdAndDog_Member_IdOrderByRecordedDateDesc(dogId, memberId);

        return healthRecords.stream()
                .map(HealthRecordDto.Response::from)
                .toList();
    }

    // 건강 기록 상세 조회
    public HealthRecordDto.Response getMyHealthRecord(Long memberId, Long healthRecordId) {
        return HealthRecordDto.Response.from(getMyHealthRecordEntity(memberId, healthRecordId));
    }

    // 건강 기록 수정
    @Transactional
    public HealthRecordDto.Response updateHealthRecord(
            Long memberId,
            Long healthRecordId,
            HealthRecordDto.UpdateRequest request
    ) {
        HealthRecord healthRecord = getMyHealthRecordEntity(memberId, healthRecordId);
        Dog dog = request.getDogId() == null ? null : getMyDog(memberId, request.getDogId());
        Long targetDogId = dog == null ? healthRecord.getDog().getId() : dog.getId();
        LocalDate targetRecordedDate = request.getRecordedDate() == null
                ? healthRecord.getRecordedDate()
                : request.getRecordedDate();

        validateNotDuplicate(targetDogId, targetRecordedDate, healthRecord.getId());

        healthRecord.update(
                dog,
                request.getRecordedDate(),
                request.getWeight(),
                request.getHealthStatus(),
                request.getSymptoms(),
                request.getMemo()
        );

        return HealthRecordDto.Response.from(healthRecord);
    }

    // 건강 기록 삭제
    @Transactional
    public void deleteHealthRecord(Long memberId, Long healthRecordId) {
        HealthRecord healthRecord = getMyHealthRecordEntity(memberId, healthRecordId);

        healthRecordRepository.delete(healthRecord);
    }

    // 건강 통계 조회
    public HealthRecordDto.SummaryResponse getHealthSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<HealthRecord> healthRecords = getHealthRecordsForSummary(memberId, dogId, startDate, endDate);
        BigDecimal latestWeight = healthRecords.stream()
                .filter(healthRecord -> healthRecord.getWeight() != null)
                .max(Comparator.comparing(HealthRecord::getRecordedDate))
                .map(HealthRecord::getWeight)
                .orElse(null);
        BigDecimal firstWeight = healthRecords.stream()
                .filter(healthRecord -> healthRecord.getWeight() != null)
                .min(Comparator.comparing(HealthRecord::getRecordedDate))
                .map(HealthRecord::getWeight)
                .orElse(null);
        Long watchCount = healthRecords.stream()
                .filter(healthRecord -> healthRecord.getHealthStatus() == HealthStatus.WATCH)
                .count();
        Long badCount = healthRecords.stream()
                .filter(healthRecord -> healthRecord.getHealthStatus() == HealthStatus.BAD)
                .count();

        return HealthRecordDto.SummaryResponse.builder()
                .totalCount((long) healthRecords.size())
                .latestWeight(latestWeight)
                .weightChange(latestWeight != null && firstWeight != null ? latestWeight.subtract(firstWeight) : null)
                .watchCount(watchCount)
                .badCount(badCount)
                .build();
    }

    // 기간별 건강 기록 Entity 목록 조회
    public List<HealthRecord> getHealthRecordsForSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Dog dog = getMyDog(memberId, dogId);

        return healthRecordRepository.findAllByDog_IdAndDog_Member_IdAndRecordedDateBetweenOrderByRecordedDateAsc(
                dog.getId(),
                memberId,
                startDate,
                endDate
        );
    }

    // 최근 건강 기록 조회
    public List<HealthRecordDto.Response> getRecentHealthRecords(Long memberId) {
        return healthRecordRepository.findTop5ByDog_Member_IdOrderByRecordedDateDesc(memberId)
                .stream()
                .map(HealthRecordDto.Response::from)
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

    // 내 건강 기록 Entity 조회
    private HealthRecord getMyHealthRecordEntity(Long memberId, Long healthRecordId) {
        return healthRecordRepository.findByIdAndDog_Member_Id(healthRecordId, memberId)
                .orElseThrow(() -> new CustomException(CareErrorCode.HEALTH_RECORD_NOT_FOUND));
    }

    // 건강 기록 중복 검증
    private void validateNotDuplicate(Long dogId, LocalDate recordedDate) {
        if (healthRecordRepository.existsByDog_IdAndRecordedDate(dogId, recordedDate)) {
            throw new CustomException(CareErrorCode.HEALTH_RECORD_ALREADY_EXISTS);
        }
    }

    // 건강 기록 중복 검증
    private void validateNotDuplicate(Long dogId, LocalDate recordedDate, Long healthRecordId) {
        if (healthRecordRepository.existsByDog_IdAndRecordedDateAndIdNot(dogId, recordedDate, healthRecordId)) {
            throw new CustomException(CareErrorCode.HEALTH_RECORD_ALREADY_EXISTS);
        }
    }
}
