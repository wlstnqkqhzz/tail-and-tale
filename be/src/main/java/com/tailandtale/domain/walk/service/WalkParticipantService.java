package com.tailandtale.domain.walk.service;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.chat.service.ChatService;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.walk.dto.WalkParticipantDto;
import com.tailandtale.domain.walk.entity.WalkParticipant;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 산책 참여 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkParticipantService {
    private final WalkParticipantRepository walkParticipantRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final MemberRepository memberRepository;
    private final DogRepository dogRepository;
    private final ChatService chatService;

    // 산책 참여 신청
    @Transactional
    public WalkParticipantDto.Response requestWalk(
            Long memberId,
            Long walkScheduleId,
            WalkParticipantDto.Request request
    ) {
        Member member = getMember(memberId);
        Dog dog = getDog(request.getDogId());
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);

        validateWalkOpen(walkSchedule);
        validateNotHost(walkSchedule, memberId);
        validateDogOwner(dog, memberId);
        validateVerifiedDog(dog);
        validateNotAlreadyActive(walkScheduleId, memberId, dog.getId());

        WalkParticipant walkParticipant = walkParticipantRepository.findByWalkScheduleIdAndMemberIdAndDogId(
                walkScheduleId,
                memberId,
                dog.getId()
        ).map(existingParticipant -> {
            existingParticipant.requestAgain(request.getMessage());
            return existingParticipant;
        }).orElseGet(() -> WalkParticipant.create(
                walkSchedule,
                member,
                dog,
                request.getMessage()
        ));

        WalkParticipant savedWalkParticipant = walkParticipantRepository.save(walkParticipant);

        return WalkParticipantDto.Response.from(savedWalkParticipant);
    }

    // 산책 참여 승인
    @Transactional
    public WalkParticipantDto.Response approveWalk(
            Long memberId,
            Long walkScheduleId,
            Long walkParticipantId
    ) {
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);
        WalkParticipant walkParticipant = getWalkParticipant(walkScheduleId, walkParticipantId);

        validateHost(walkSchedule, memberId);
        validateWalkOpen(walkSchedule);
        validateRequested(walkParticipant);

        long approvedParticipantCount = getApprovedCount(walkScheduleId);

        validateCapacity(walkSchedule, approvedParticipantCount);

        walkParticipant.approve();
        chatService.addParticipant(walkSchedule, walkParticipant.getMember());

        if (getTotalParticipantCountAfterApprove(approvedParticipantCount) == walkSchedule.getMaxParticipants()) {
            walkSchedule.close();
        }

        return WalkParticipantDto.Response.from(walkParticipant);
    }

    // 산책 참여 거절
    @Transactional
    public WalkParticipantDto.Response rejectWalk(
            Long memberId,
            Long walkScheduleId,
            Long walkParticipantId
    ) {
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);
        WalkParticipant walkParticipant = getWalkParticipant(walkScheduleId, walkParticipantId);

        validateHost(walkSchedule, memberId);
        validateRequested(walkParticipant);

        walkParticipant.reject();

        return WalkParticipantDto.Response.from(walkParticipant);
    }

    // 산책 참여 취소
    @Transactional
    public WalkParticipantDto.Response cancelWalk(
            Long memberId,
            Long walkScheduleId,
            Long walkParticipantId
    ) {
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);
        WalkParticipant walkParticipant = getWalkParticipant(walkScheduleId, walkParticipantId);

        validateParticipantOwner(walkParticipant, memberId);

        if (walkParticipant.getStatus() == WalkParticipantStatus.CANCELED) {
            throw new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_ALREADY_CANCELED);
        }

        WalkParticipantStatus previousStatus = walkParticipant.getStatus();

        walkParticipant.cancel();

        if (previousStatus == WalkParticipantStatus.APPROVED && walkSchedule.getStatus() == WalkScheduleStatus.CLOSED) {
            walkSchedule.reopen();
        }

        if (previousStatus == WalkParticipantStatus.APPROVED) {
            chatService.leaveParticipant(walkSchedule.getId(), walkParticipant.getMember().getId());
        }

        return WalkParticipantDto.Response.from(walkParticipant);
    }

    // 참여자 목록 조회
    public List<WalkParticipantDto.Response> getParticipants(Long walkScheduleId) {
        getWalkSchedule(walkScheduleId);

        return walkParticipantRepository.findAllByWalkScheduleIdOrderByCreatedAtAsc(walkScheduleId)
                .stream()
                .map(WalkParticipantDto.Response::from)
                .toList();
    }

    // 회원 조회
    private Member getMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    // 반려견 조회
    private Dog getDog(Long dogId) {
        return dogRepository.findById(dogId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));
    }

    // 산책 일정 조회
    private WalkSchedule getWalkSchedule(Long walkScheduleId) {
        return walkScheduleRepository.findById(walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_NOT_FOUND));
    }

    // 산책 참여 조회
    private WalkParticipant getWalkParticipant(Long walkScheduleId, Long walkParticipantId) {
        return walkParticipantRepository.findByIdAndWalkScheduleId(walkParticipantId, walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_NOT_FOUND));
    }

    // 모집 중 상태 검증
    private void validateWalkOpen(WalkSchedule walkSchedule) {
        if (walkSchedule.getStatus() != WalkScheduleStatus.OPEN) {
            throw new CustomException(WalkParticipantErrorCode.WALK_NOT_OPEN);
        }
    }

    // 본인 산책 참여 방지
    private void validateNotHost(WalkSchedule walkSchedule, Long memberId) {
        if (walkSchedule.getHostMember().getId().equals(memberId)) {
            throw new CustomException(WalkParticipantErrorCode.CANNOT_JOIN_OWN_WALK);
        }
    }

    // 산책 일정 작성자 검증
    private void validateHost(WalkSchedule walkSchedule, Long memberId) {
        if (!walkSchedule.getHostMember().getId().equals(memberId)) {
            throw new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_ACCESS_DENIED);
        }
    }

    // 참여 정보 소유자 검증
    private void validateParticipantOwner(WalkParticipant walkParticipant, Long memberId) {
        if (!walkParticipant.getMember().getId().equals(memberId)) {
            throw new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_ACCESS_DENIED);
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

    // 중복 신청 검증
    private void validateNotAlreadyActive(Long walkScheduleId, Long memberId, Long dogId) {
        boolean alreadyActive = walkParticipantRepository.existsByWalkScheduleIdAndMemberIdAndDogIdAndStatusIn(
                walkScheduleId,
                memberId,
                dogId,
                List.of(WalkParticipantStatus.REQUESTED, WalkParticipantStatus.APPROVED)
        );

        if (alreadyActive) {
            throw new CustomException(WalkParticipantErrorCode.ALREADY_REQUESTED_WALK);
        }
    }

    // 신청 상태 검증
    private void validateRequested(WalkParticipant walkParticipant) {
        if (walkParticipant.getStatus() != WalkParticipantStatus.REQUESTED) {
            throw new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_NOT_REQUESTED);
        }
    }

    // 승인 가능 인원 검증
    private void validateCapacity(WalkSchedule walkSchedule, long approvedParticipantCount) {
        long totalCountAfterApprove = getTotalParticipantCountAfterApprove(approvedParticipantCount);

        if (totalCountAfterApprove > walkSchedule.getMaxParticipants()) {
            throw new CustomException(WalkParticipantErrorCode.WALK_PARTICIPANT_FULL);
        }
    }

    // 호스트 1명과 이번 승인자를 포함한 전체 참여 인원 계산
    private long getTotalParticipantCountAfterApprove(long approvedParticipantCount) {
        return 1 + approvedParticipantCount + 1;
    }

    // 승인된 참여자 수 조회
    private long getApprovedCount(Long walkScheduleId) {
        return walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkScheduleId,
                WalkParticipantStatus.APPROVED
        );
    }
}
