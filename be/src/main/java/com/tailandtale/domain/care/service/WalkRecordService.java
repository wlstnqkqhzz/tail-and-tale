package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.dto.WalkRecordDto;
import com.tailandtale.domain.care.entity.ConditionAfterWalk;
import com.tailandtale.domain.care.entity.WalkRecord;
import com.tailandtale.domain.care.repository.WalkRecordRepository;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.service.TrustScoreService;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.CareErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import com.tailandtale.global.exception.WalkScheduleErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

// 산책 기록 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkRecordService {
    private final WalkRecordRepository walkRecordRepository;
    private final DogRepository dogRepository;
    private final MemberRepository memberRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final TrustScoreService trustScoreService;

    // 산책 기록 생성
    @Transactional
    public WalkRecordDto.Response createWalkRecord(Long memberId, WalkRecordDto.CreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
        Dog dog = getMyDog(memberId, request.getDogId());
        WalkSchedule walkSchedule = getConnectableWalkSchedule(memberId, request.getWalkScheduleId());

        validateWalkRecordTime(request.getStartedAt(), request.getEndedAt());

        WalkRecord walkRecord = WalkRecord.create(
                member,
                dog,
                walkSchedule,
                request.getStartedAt(),
                request.getEndedAt(),
                request.getDurationMinutes(),
                request.getDistanceKm(),
                request.getRouteSummary(),
                request.getMemo(),
                request.getConditionAfterWalk()
        );

        WalkRecord savedWalkRecord = walkRecordRepository.save(walkRecord);

        trustScoreService.evaluateBadges(memberId);

        return WalkRecordDto.Response.from(savedWalkRecord);
    }

    // 산책 기록 목록 조회
    public List<WalkRecordDto.Response> getMyWalkRecords(Long memberId, Long dogId) {
        List<WalkRecord> walkRecords = dogId == null
                ? walkRecordRepository.findAllByMember_IdOrderByStartedAtDesc(memberId)
                : walkRecordRepository.findAllByDog_IdAndMember_IdOrderByStartedAtDesc(dogId, memberId);

        return walkRecords.stream()
                .map(WalkRecordDto.Response::from)
                .toList();
    }

    // 산책 기록 상세 조회
    public WalkRecordDto.Response getMyWalkRecord(Long memberId, Long walkRecordId) {
        return WalkRecordDto.Response.from(getMyWalkRecordEntity(memberId, walkRecordId));
    }

    // 산책 기록 수정
    @Transactional
    public WalkRecordDto.Response updateWalkRecord(
            Long memberId,
            Long walkRecordId,
            WalkRecordDto.UpdateRequest request
    ) {
        WalkRecord walkRecord = getMyWalkRecordEntity(memberId, walkRecordId);
        Dog dog = request.getDogId() == null ? null : getMyDog(memberId, request.getDogId());
        WalkSchedule walkSchedule = getConnectableWalkSchedule(memberId, request.getWalkScheduleId());
        LocalDateTime targetStartedAt = request.getStartedAt() == null ? walkRecord.getStartedAt() : request.getStartedAt();
        LocalDateTime targetEndedAt = request.getEndedAt() == null ? walkRecord.getEndedAt() : request.getEndedAt();

        validateWalkRecordTime(targetStartedAt, targetEndedAt);

        walkRecord.update(
                dog,
                walkSchedule,
                request.getStartedAt(),
                request.getEndedAt(),
                request.getDurationMinutes(),
                request.getDistanceKm(),
                request.getRouteSummary(),
                request.getMemo(),
                request.getConditionAfterWalk()
        );

        return WalkRecordDto.Response.from(walkRecord);
    }

    // 산책 기록 삭제
    @Transactional
    public void deleteWalkRecord(Long memberId, Long walkRecordId) {
        WalkRecord walkRecord = getMyWalkRecordEntity(memberId, walkRecordId);

        walkRecordRepository.delete(walkRecord);
    }

    // 산책 기록 통계 조회
    public WalkRecordDto.SummaryResponse getWalkSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<WalkRecord> walkRecords = getWalkRecordsForSummary(memberId, dogId, startDate, endDate);
        Integer totalDurationMinutes = walkRecords.stream()
                .map(WalkRecord::getDurationMinutes)
                .filter(durationMinutes -> durationMinutes != null)
                .reduce(0, Integer::sum);
        BigDecimal totalDistanceKm = walkRecords.stream()
                .map(WalkRecord::getDistanceKm)
                .filter(distanceKm -> distanceKm != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Double averageDurationMinutes = walkRecords.stream()
                .map(WalkRecord::getDurationMinutes)
                .filter(durationMinutes -> durationMinutes != null)
                .mapToInt(Integer::intValue)
                .average()
                .stream()
                .boxed()
                .findFirst()
                .orElse(null);
        WalkRecord latestWalkRecord = walkRecords.stream()
                .max(Comparator.comparing(WalkRecord::getStartedAt))
                .orElse(null);

        return WalkRecordDto.SummaryResponse.builder()
                .totalCount((long) walkRecords.size())
                .totalDurationMinutes(totalDurationMinutes)
                .averageDurationMinutes(averageDurationMinutes)
                .totalDistanceKm(totalDistanceKm)
                .latestConditionAfterWalk(latestWalkRecord == null ? null : latestWalkRecord.getConditionAfterWalk())
                .latestWalkDate(latestWalkRecord == null ? null : latestWalkRecord.getStartedAt().toLocalDate())
                .build();
    }

    // 기간별 산책 기록 Entity 목록 조회
    public List<WalkRecord> getWalkRecordsForSummary(
            Long memberId,
            Long dogId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Dog dog = getMyDog(memberId, dogId);

        return walkRecordRepository.findAllByDog_IdAndMember_IdAndStartedAtBetweenOrderByStartedAtAsc(
                dog.getId(),
                memberId,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay().minusNanos(1)
        );
    }

    // 최근 산책 기록 조회
    public List<WalkRecordDto.Response> getRecentWalkRecords(Long memberId) {
        return walkRecordRepository.findTop5ByMember_IdOrderByStartedAtDesc(memberId)
                .stream()
                .map(WalkRecordDto.Response::from)
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

    // 내 산책 기록 Entity 조회
    private WalkRecord getMyWalkRecordEntity(Long memberId, Long walkRecordId) {
        return walkRecordRepository.findByIdAndMember_Id(walkRecordId, memberId)
                .orElseThrow(() -> new CustomException(CareErrorCode.WALK_RECORD_NOT_FOUND));
    }

    // 연결 가능한 산책 일정 조회
    private WalkSchedule getConnectableWalkSchedule(Long memberId, Long walkScheduleId) {
        if (walkScheduleId == null) {
            return null;
        }

        WalkSchedule walkSchedule = walkScheduleRepository.findById(walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_NOT_FOUND));

        boolean host = walkSchedule.getHostMember().getId().equals(memberId);
        boolean approvedParticipant = walkParticipantRepository.existsByWalkScheduleIdAndMemberIdAndStatus(
                walkScheduleId,
                memberId,
                WalkParticipantStatus.APPROVED
        );

        if (!host && !approvedParticipant) {
            throw new CustomException(CareErrorCode.WALK_RECORD_SCHEDULE_ACCESS_DENIED);
        }

        return walkSchedule;
    }

    // 산책 기록 시간 검증
    private void validateWalkRecordTime(LocalDateTime startedAt, LocalDateTime endedAt) {
        if (startedAt != null && endedAt != null && !endedAt.isAfter(startedAt)) {
            throw new CustomException(CareErrorCode.WALK_RECORD_TIME_INVALID);
        }
    }
}
