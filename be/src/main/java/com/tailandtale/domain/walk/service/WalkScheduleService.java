package com.tailandtale.domain.walk.service;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.chat.service.ChatService;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.service.TrustScoreService;
import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkReviewRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import com.tailandtale.global.exception.WalkScheduleErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 산책 일정 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkScheduleService {
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final WalkReviewRepository walkReviewRepository;
    private final MemberRepository memberRepository;
    private final DogRepository dogRepository;
    private final ChatService chatService;
    private final TrustScoreService trustScoreService;

    // 산책 일정 생성
    @Transactional
    public WalkScheduleDto.DetailResponse createSchedule(
            Long memberId,
            WalkScheduleDto.CreateRequest request
    ) {
        // 회원 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        // 반려견 조회
        Dog dog = getDog(request.getDogId());

        // 본인 반려견 여부 검증
        validateDogOwner(dog, member.getId());
        validateVerifiedDog(dog);

        // 산책 일정 생성
        WalkSchedule walkSchedule = WalkSchedule.create(
                member,
                dog,
                request.getTitle(),
                request.getDescription(),
                request.getRegion(),
                request.getMeetingPlace(),
                request.getLatitude(),
                request.getLongitude(),
                request.getScheduledAt(),
                request.getExpectedDurationMinutes(),
                request.getMaxParticipants(),
                request.getPreferredDogSize(),
                request.getPreferredPersonality()
        );

        // 산책 일정 저장
        WalkSchedule savedWalkSchedule = walkScheduleRepository.save(walkSchedule);
        chatService.createChatRoom(savedWalkSchedule);

        // 산책 일정 응답 반환
        return toDetailResponse(savedWalkSchedule, memberId);
    }

    // 산책 일정 수정
    @Transactional
    public WalkScheduleDto.DetailResponse updateSchedule(
            Long memberId,
            Long walkScheduleId,
            WalkScheduleDto.UpdateRequest request
    ) {
        WalkSchedule walkSchedule = getScheduleEntity(walkScheduleId);

        validateHostMember(walkSchedule, memberId);
        validateEditableSchedule(walkSchedule);

        Dog dog = null;

        if (request.getDogId() != null) {
            dog = getDog(request.getDogId());
            validateDogOwner(dog, memberId);
            validateVerifiedDog(dog);
        }

        walkSchedule.update(
                dog,
                request.getTitle(),
                request.getDescription(),
                request.getRegion(),
                request.getMeetingPlace(),
                request.getLatitude(),
                request.getLongitude(),
                request.getScheduledAt(),
                request.getExpectedDurationMinutes(),
                request.getMaxParticipants(),
                request.getPreferredDogSize(),
                request.getPreferredPersonality()
        );

        return toDetailResponse(walkSchedule, memberId);
    }

    // 산책 일정 취소
    @Transactional
    public WalkScheduleDto.DetailResponse cancelSchedule(Long memberId, Long walkScheduleId) {
        WalkSchedule walkSchedule = getScheduleEntity(walkScheduleId);

        validateHostMember(walkSchedule, memberId);
        validateEditableSchedule(walkSchedule);

        walkSchedule.cancel();
        chatService.closeChatRoom(walkSchedule.getId());

        return toDetailResponse(walkSchedule, memberId);
    }

    // 산책 모집 마감
    @Transactional
    public WalkScheduleDto.DetailResponse closeSchedule(Long memberId, Long walkScheduleId) {
        WalkSchedule walkSchedule = getScheduleEntity(walkScheduleId);

        validateHostMember(walkSchedule, memberId);
        validateRecruitmentChangeable(walkSchedule);

        if (walkSchedule.getStatus() == WalkScheduleStatus.CLOSED) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ALREADY_CLOSED);
        }

        walkSchedule.close();

        return toDetailResponse(walkSchedule, memberId);
    }

    // 산책 모집 재개
    @Transactional
    public WalkScheduleDto.DetailResponse reopenSchedule(Long memberId, Long walkScheduleId) {
        WalkSchedule walkSchedule = getScheduleEntity(walkScheduleId);

        validateHostMember(walkSchedule, memberId);
        validateRecruitmentChangeable(walkSchedule);

        if (walkSchedule.getStatus() == WalkScheduleStatus.OPEN) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ALREADY_OPEN);
        }

        validateReopenableSchedule(walkSchedule);

        walkSchedule.reopen();

        return toDetailResponse(walkSchedule, memberId);
    }

    // 산책 일정 목록 조회
    @Transactional
    public List<WalkScheduleDto.DetailResponse> getSchedules(
            Long memberId,
            WalkScheduleDto.SearchCondition condition
    ) {
        completeExpiredSchedules();

        return walkScheduleRepository.search(condition)
                .stream()
                .map(walkSchedule -> toDetailResponse(walkSchedule, memberId))
                .filter(response -> !Boolean.TRUE.equals(condition.getRecruitableOnly()) || Boolean.TRUE.equals(response.getIsRecruitable()))
                .toList();
    }

    // 산책 일정 상세 조회
    @Transactional
    public WalkScheduleDto.DetailResponse getSchedule(Long memberId, Long walkScheduleId) {
        completeExpiredSchedules();

        WalkSchedule walkSchedule = getScheduleEntity(walkScheduleId);

        return toDetailResponse(walkSchedule, memberId);
    }

    // 지난 산책 일정 자동 완료 처리
    @Transactional
    public int completeExpiredSchedules() {
        LocalDateTime now = LocalDateTime.now();
        List<WalkSchedule> targets = walkScheduleRepository.findAllByStatusInAndScheduledAtBefore(
                List.of(WalkScheduleStatus.OPEN, WalkScheduleStatus.CLOSED),
                now
        );

        return (int) targets.stream()
                .filter(walkSchedule -> isWalkEnded(walkSchedule, now))
                .peek(this::completeSchedule)
                .count();
    }

    // 산책 일정 완료 및 신뢰도/뱃지 반영
    private void completeSchedule(WalkSchedule walkSchedule) {
        walkSchedule.complete();
        trustScoreService.applyWalkCompleted(walkSchedule.getHostMember(), walkSchedule);
        walkParticipantRepository.findAllByWalkScheduleIdOrderByCreatedAtAsc(walkSchedule.getId())
                .stream()
                .filter(walkParticipant -> walkParticipant.getStatus() == WalkParticipantStatus.APPROVED)
                .forEach(walkParticipant -> trustScoreService.applyWalkCompleted(walkParticipant.getMember(), walkSchedule));
    }

    // 산책 일정 Entity 조회
    private WalkSchedule getScheduleEntity(Long walkScheduleId) {
        return walkScheduleRepository.findById(walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_NOT_FOUND));
    }

    // 산책 종료 시각 경과 여부 확인
    private boolean isWalkEnded(WalkSchedule walkSchedule, LocalDateTime now) {
        int expectedDurationMinutes = walkSchedule.getExpectedDurationMinutes() == null
                ? 0
                : walkSchedule.getExpectedDurationMinutes();

        return !walkSchedule.getScheduledAt()
                .plusMinutes(expectedDurationMinutes)
                .isAfter(now);
    }

    // 반려견 Entity 조회
    private Dog getDog(Long dogId) {
        return dogRepository.findById(dogId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));
    }

    // 산책 일정 작성자 검증
    private void validateHostMember(WalkSchedule walkSchedule, Long memberId) {
        if (!walkSchedule.getHostMember().getId().equals(memberId)) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ACCESS_DENIED);
        }
    }

    // 반려견 소유자 검증
    private void validateDogOwner(Dog dog, Long memberId) {
        if (!dog.getMember().getId().equals(memberId)) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_DOG_ACCESS_DENIED);
        }
    }

    // 반려견 인증 여부 검증
    private void validateVerifiedDog(Dog dog) {
        if (!Boolean.TRUE.equals(dog.getIsVerified())) {
            throw new CustomException(DogErrorCode.DOG_NOT_VERIFIED);
        }
    }

    // 산책 일정 수정 가능 상태 검증
    private void validateEditableSchedule(WalkSchedule walkSchedule) {
        if (walkSchedule.getStatus() == WalkScheduleStatus.CANCELED) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ALREADY_CANCELED);
        }
    }

    // 모집 상태 변경 가능 여부 검증
    private void validateRecruitmentChangeable(WalkSchedule walkSchedule) {
        if (walkSchedule.getStatus() == WalkScheduleStatus.CANCELED) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ALREADY_CANCELED);
        }
        if (walkSchedule.getStatus() == WalkScheduleStatus.COMPLETED) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_ALREADY_COMPLETED);
        }
    }

    // 모집 재개 가능 여부 검증
    private void validateReopenableSchedule(WalkSchedule walkSchedule) {
        long approvedParticipantCount = walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkSchedule.getId(),
                WalkParticipantStatus.APPROVED
        );
        long currentParticipantCount = approvedParticipantCount + 1;

        if (currentParticipantCount >= walkSchedule.getMaxParticipants()) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_FULL);
        }
        if (!walkSchedule.getScheduledAt().isAfter(LocalDateTime.now())) {
            throw new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_PAST_TIME);
        }
    }

    // 산책 일정 응답 생성
    private WalkScheduleDto.DetailResponse toDetailResponse(WalkSchedule walkSchedule, Long memberId) {
        long approvedParticipantCount = walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkSchedule.getId(),
                WalkParticipantStatus.APPROVED
        );
        long pendingRequestCount = walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkSchedule.getId(),
                WalkParticipantStatus.REQUESTED
        );
        WalkParticipantStatus myParticipantStatus = getMyParticipantStatus(walkSchedule.getId(), memberId);
        Double averageRating = walkReviewRepository.findAverageRatingByWalkScheduleId(walkSchedule.getId());
        long reviewCount = walkReviewRepository.countByWalkScheduleId(walkSchedule.getId());

        return WalkScheduleDto.DetailResponse.from(
                walkSchedule,
                approvedParticipantCount,
                pendingRequestCount,
                myParticipantStatus,
                averageRating,
                reviewCount
        );
    }

    // 내 산책 참여 상태 조회
    private WalkParticipantStatus getMyParticipantStatus(Long walkScheduleId, Long memberId) {
        return walkParticipantRepository.findFirstByWalkScheduleIdAndMemberIdOrderByCreatedAtDesc(
                        walkScheduleId,
                        memberId
                )
                .map(walkParticipant -> walkParticipant.getStatus())
                .orElse(null);
    }
}
