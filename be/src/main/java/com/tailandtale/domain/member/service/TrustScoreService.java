package com.tailandtale.domain.member.service;

import com.tailandtale.domain.care.repository.EmotionDiaryRepository;
import com.tailandtale.domain.care.repository.HealthRecordRepository;
import com.tailandtale.domain.care.repository.WalkRecordRepository;
import com.tailandtale.domain.member.dto.TrustScoreDto;
import com.tailandtale.domain.member.entity.*;
import com.tailandtale.domain.member.repository.BadgeRepository;
import com.tailandtale.domain.member.repository.MemberBadgeRepository;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.repository.TrustScoreHistoryRepository;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationType;
import com.tailandtale.domain.notification.service.NotificationService;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkReview;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkReviewRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 신뢰도 및 뱃지 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrustScoreService {
    private static final int DEFAULT_TRUST_SCORE = 60;
    private static final int BADGE_TRUST_BONUS = 5;

    private final TrustScoreHistoryRepository trustScoreHistoryRepository;
    private final BadgeRepository badgeRepository;
    private final MemberBadgeRepository memberBadgeRepository;
    private final MemberRepository memberRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final WalkReviewRepository walkReviewRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkRecordRepository walkRecordRepository;
    private final EmotionDiaryRepository emotionDiaryRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final NotificationService notificationService;

    // 회원 신뢰도 요약 조회
    public TrustScoreDto.SummaryResponse getSummary(Long memberId) {
        int trustScore = getCurrentScore(memberId);

        return TrustScoreDto.SummaryResponse.builder()
                .trustScore(trustScore)
                .trustLevel(resolveTrustLevel(trustScore))
                .badges(memberBadgeRepository.findAllByMemberIdOrderByEarnedAtDesc(memberId)
                        .stream()
                        .map(TrustScoreDto.BadgeResponse::from)
                        .toList())
                .build();
    }

    // 후기 수신 신뢰도 반영
    @Transactional
    public void applyReviewReceived(WalkReview walkReview) {
        if (trustScoreHistoryRepository.existsByMemberIdAndReasonTypeAndRelatedTypeAndRelatedId(
                walkReview.getReviewee().getId(),
                TrustScoreReasonType.REVIEW_RECEIVED,
                TrustScoreRelatedType.WALK_REVIEW,
                walkReview.getId()
        )) {
            return;
        }

        int delta = resolveReviewDelta(walkReview.getRating());

        if (delta != 0) {
            addScore(
                    walkReview.getReviewee(),
                    delta,
                    TrustScoreReasonType.REVIEW_RECEIVED,
                    "산책 후기를 받아 신뢰도가 반영되었습니다.",
                    TrustScoreRelatedType.WALK_REVIEW,
                    walkReview.getId()
            );
        }

        evaluateBadges(walkReview.getReviewee());
    }

    // 산책 완료 신뢰도 반영
    @Transactional
    public void applyWalkCompleted(Member member, WalkSchedule walkSchedule) {
        if (trustScoreHistoryRepository.existsByMemberIdAndReasonTypeAndRelatedTypeAndRelatedId(
                member.getId(),
                TrustScoreReasonType.WALK_COMPLETED,
                TrustScoreRelatedType.WALK_SCHEDULE,
                walkSchedule.getId()
        )) {
            return;
        }

        addScore(
                member,
                10,
                TrustScoreReasonType.WALK_COMPLETED,
                "완료된 산책 일정 참여로 신뢰도가 상승했습니다.",
                TrustScoreRelatedType.WALK_SCHEDULE,
                walkSchedule.getId()
        );
        evaluateBadges(member);
    }

    // 신고 처리 신뢰도 반영
    @Transactional
    public void applyReportResolved(Member reportedMember, Long reportId) {
        if (reportedMember == null || trustScoreHistoryRepository.existsByMemberIdAndReasonTypeAndRelatedTypeAndRelatedId(
                reportedMember.getId(),
                TrustScoreReasonType.REPORT_RESOLVED,
                TrustScoreRelatedType.REPORT,
                reportId
        )) {
            return;
        }

        addScore(
                reportedMember,
                -10,
                TrustScoreReasonType.REPORT_RESOLVED,
                "신고 처리 결과에 따라 신뢰도가 조정되었습니다.",
                TrustScoreRelatedType.REPORT,
                reportId
        );
        evaluateBadges(reportedMember);
    }

    // 회원 뱃지 재평가
    @Transactional
    public void evaluateBadges(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        evaluateBadges(member);
    }

    private void evaluateBadges(Member member) {
        badgeRepository.findAllByIsActiveTrueOrderByIdAsc()
                .stream()
                .filter(badge -> badge.getConditionType() != BadgeConditionType.ADMIN_GRANT)
                .filter(badge -> !memberBadgeRepository.existsByMemberIdAndBadgeId(member.getId(), badge.getId()))
                .filter(badge -> isBadgeEarned(member.getId(), badge))
                .forEach(badge -> awardBadge(member, badge));
    }

    private void awardBadge(Member member, Badge badge) {
        MemberBadge memberBadge = memberBadgeRepository.save(MemberBadge.create(
                member,
                badge,
                badge.getName() + " 뱃지를 획득했습니다."
        ));

        addScore(
                member,
                BADGE_TRUST_BONUS,
                TrustScoreReasonType.BADGE_EARNED,
                badge.getName() + " 뱃지를 획득했습니다.",
                TrustScoreRelatedType.BADGE,
                memberBadge.getBadge().getId()
        );
        notificationService.createNotification(
                member,
                NotificationType.BADGE_EARNED,
                "새 뱃지를 획득했습니다.",
                badge.getName() + " 뱃지를 획득했습니다.",
                NotificationTargetType.BADGE,
                badge.getId()
        );
    }

    private boolean isBadgeEarned(Long memberId, Badge badge) {
        int conditionValue = badge.getConditionValue() == null ? 0 : badge.getConditionValue();

        return switch (badge.getConditionType()) {
            case WALK_COUNT -> getCompletedWalkCount(memberId) >= conditionValue;
            case REVIEW_SCORE -> walkReviewRepository.countByRevieweeIdAndRatingGreaterThanEqual(
                    memberId,
                    4
            ) >= conditionValue;
            case CARE_RECORD_COUNT -> getCareRecordCount(memberId) >= conditionValue;
            case TRUST_SCORE -> getCurrentScore(memberId) >= conditionValue;
            case ADMIN_GRANT, ETC -> false;
        };
    }

    private long getCareRecordCount(Long memberId) {
        return walkRecordRepository.countByMember_Id(memberId)
                + emotionDiaryRepository.countByDog_Member_Id(memberId)
                + healthRecordRepository.countByDog_Member_Id(memberId);
    }

    private long getCompletedWalkCount(Long memberId) {
        return walkScheduleRepository.countByHostMemberIdAndStatus(memberId, WalkScheduleStatus.COMPLETED)
                + walkParticipantRepository.countCompletedParticipationsByMemberId(
                memberId,
                WalkParticipantStatus.APPROVED,
                WalkScheduleStatus.COMPLETED
        );
    }

    private void addScore(
            Member member,
            int scoreDelta,
            TrustScoreReasonType reasonType,
            String reasonDetail,
            TrustScoreRelatedType relatedType,
            Long relatedId
    ) {
        int scoreAfter = clampScore(getCurrentScore(member.getId()) + scoreDelta);

        trustScoreHistoryRepository.save(TrustScoreHistory.create(
                member,
                scoreDelta,
                scoreAfter,
                reasonType,
                reasonDetail,
                relatedType,
                relatedId
        ));
    }

    private int getCurrentScore(Long memberId) {
        return trustScoreHistoryRepository.findTopByMemberIdOrderByCreatedAtDescIdDesc(memberId)
                .map(TrustScoreHistory::getScoreAfter)
                .orElse(DEFAULT_TRUST_SCORE);
    }

    private int resolveReviewDelta(Integer rating) {
        if (rating == null) {
            return 0;
        }
        if (rating >= 5) {
            return 8;
        }
        if (rating >= 4) {
            return 5;
        }
        if (rating >= 3) {
            return 2;
        }
        if (rating >= 2) {
            return -2;
        }
        return -5;
    }

    private int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private String resolveTrustLevel(int trustScore) {
        if (trustScore >= 80) {
            return "TRUSTED";
        }
        if (trustScore >= 60) {
            return "NORMAL";
        }
        if (trustScore >= 40) {
            return "CAUTION";
        }
        return "LOW";
    }
}
