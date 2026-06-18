package com.tailandtale.domain.walk.service;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.walk.dto.WalkReviewDto;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkReview;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkReviewRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import com.tailandtale.global.exception.WalkReviewErrorCode;
import com.tailandtale.global.exception.WalkScheduleErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 산책 후기 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalkReviewService {
    private final WalkReviewRepository walkReviewRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final MemberRepository memberRepository;

    // 산책 후기 생성
    @Transactional
    public WalkReviewDto.Response createReview(
            Long memberId,
            Long walkScheduleId,
            WalkReviewDto.CreateRequest request
    ) {
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);
        Member reviewer = getMember(memberId);
        Member reviewee = getMember(request.getRevieweeId());

        validateReviewWritable(walkSchedule);
        validateWalkMember(walkSchedule, reviewer.getId());
        validateWalkMember(walkSchedule, reviewee.getId());
        validateNotSelf(reviewer.getId(), reviewee.getId());
        validateNotDuplicated(walkSchedule.getId(), reviewer.getId(), reviewee.getId());

        WalkReview walkReview = WalkReview.create(
                walkSchedule,
                reviewer,
                reviewee,
                request.getRating(),
                request.getContent()
        );

        return WalkReviewDto.Response.from(walkReviewRepository.save(walkReview));
    }

    // 산책 후기 목록 조회
    public List<WalkReviewDto.Response> getScheduleReviews(Long walkScheduleId) {
        getWalkSchedule(walkScheduleId);

        return walkReviewRepository.findAllByWalkScheduleIdOrderByCreatedAtDesc(walkScheduleId)
                .stream()
                .map(WalkReviewDto.Response::from)
                .toList();
    }

    // 내가 작성한 산책 후기 목록 조회
    public List<WalkReviewDto.Response> getMyWrittenReviews(Long memberId) {
        return walkReviewRepository.findAllByReviewerIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WalkReviewDto.Response::from)
                .toList();
    }

    // 내가 받은 산책 후기 목록 조회
    public List<WalkReviewDto.Response> getMyReceivedReviews(Long memberId) {
        return walkReviewRepository.findAllByRevieweeIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WalkReviewDto.Response::from)
                .toList();
    }

    // 최근 내가 작성한 산책 후기 목록 조회
    public List<WalkReviewDto.Response> getRecentWrittenReviews(Long memberId) {
        return walkReviewRepository.findTop5ByReviewerIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WalkReviewDto.Response::from)
                .toList();
    }

    // 최근 내가 받은 산책 후기 목록 조회
    public List<WalkReviewDto.Response> getRecentReceivedReviews(Long memberId) {
        return walkReviewRepository.findTop5ByRevieweeIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WalkReviewDto.Response::from)
                .toList();
    }

    // 산책 후기 수정
    @Transactional
    public WalkReviewDto.Response updateReview(
            Long memberId,
            Long walkReviewId,
            WalkReviewDto.UpdateRequest request
    ) {
        WalkReview walkReview = getMyReview(walkReviewId, memberId);

        walkReview.update(
                request.getRating(),
                request.getContent()
        );

        return WalkReviewDto.Response.from(walkReview);
    }

    // 산책 후기 삭제
    @Transactional
    public void deleteReview(Long memberId, Long walkReviewId) {
        WalkReview walkReview = getMyReview(walkReviewId, memberId);

        walkReviewRepository.delete(walkReview);
    }

    // 산책 일정 조회
    private WalkSchedule getWalkSchedule(Long walkScheduleId) {
        return walkScheduleRepository.findById(walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_NOT_FOUND));
    }

    // 회원 조회
    private Member getMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    // 내 산책 후기 조회
    private WalkReview getMyReview(Long walkReviewId, Long memberId) {
        return walkReviewRepository.findByIdAndReviewerId(walkReviewId, memberId)
                .orElseThrow(() -> new CustomException(WalkReviewErrorCode.WALK_REVIEW_NOT_FOUND));
    }

    // 산책 후기 작성 가능 여부 검증
    private void validateReviewWritable(WalkSchedule walkSchedule) {
        if (walkSchedule.getStatus() == WalkScheduleStatus.CANCELED) {
            throw new CustomException(WalkReviewErrorCode.WALK_REVIEW_CANCELED_SCHEDULE);
        }
        if (walkSchedule.getScheduledAt().isAfter(LocalDateTime.now())) {
            throw new CustomException(WalkReviewErrorCode.WALK_REVIEW_NOT_FINISHED);
        }
    }

    // 산책 참여 회원 여부 검증
    private void validateWalkMember(WalkSchedule walkSchedule, Long memberId) {
        boolean host = walkSchedule.getHostMember().getId().equals(memberId);
        boolean approvedParticipant = walkParticipantRepository.existsByWalkScheduleIdAndMemberIdAndStatus(
                walkSchedule.getId(),
                memberId,
                WalkParticipantStatus.APPROVED
        );

        if (!host && !approvedParticipant) {
            throw new CustomException(WalkReviewErrorCode.WALK_REVIEW_TARGET_INVALID);
        }
    }

    // 본인 후기 작성 방지
    private void validateNotSelf(Long reviewerId, Long revieweeId) {
        if (reviewerId.equals(revieweeId)) {
            throw new CustomException(WalkReviewErrorCode.WALK_REVIEW_SELF_NOT_ALLOWED);
        }
    }

    // 중복 후기 작성 방지
    private void validateNotDuplicated(Long walkScheduleId, Long reviewerId, Long revieweeId) {
        if (walkReviewRepository.existsByWalkScheduleIdAndReviewerIdAndRevieweeId(
                walkScheduleId,
                reviewerId,
                revieweeId
        )) {
            throw new CustomException(WalkReviewErrorCode.WALK_REVIEW_DUPLICATED);
        }
    }
}
