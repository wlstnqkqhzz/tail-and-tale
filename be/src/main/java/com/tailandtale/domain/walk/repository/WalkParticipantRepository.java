package com.tailandtale.domain.walk.repository;

import com.tailandtale.domain.walk.entity.WalkParticipant;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

// 산책 참여 Repository

public interface WalkParticipantRepository extends JpaRepository<WalkParticipant, Long> {
    // 산책 참여 상태 여부 확인
    boolean existsByWalkScheduleIdAndMemberIdAndDogIdAndStatusIn(
            Long walkScheduleId,
            Long memberId,
            Long dogId,
            Collection<WalkParticipantStatus> statuses
    );

    // 산책 참여 조회
    Optional<WalkParticipant> findByWalkScheduleIdAndMemberIdAndDogId(
            Long walkScheduleId,
            Long memberId,
            Long dogId
    );

    // 산책 참여 ID 조회
    Optional<WalkParticipant> findByIdAndWalkScheduleId(
            Long walkParticipantId,
            Long walkScheduleId
    );

    // 참여자 목록 조회
    List<WalkParticipant> findAllByWalkScheduleIdOrderByCreatedAtAsc(Long walkScheduleId);

    // 내 산책 참여 목록 조회
    List<WalkParticipant> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 승인된 참여 인원 조회
    long countByWalkScheduleIdAndStatus(
            Long walkScheduleId,
            WalkParticipantStatus status
    );

    // 회원별 승인 산책 참여 수 조회
    long countByMemberIdAndStatus(Long memberId, WalkParticipantStatus status);

    // 회원의 특정 산책 참여 상태 여부 확인
    boolean existsByWalkScheduleIdAndMemberIdAndStatus(
            Long walkScheduleId,
            Long memberId,
            WalkParticipantStatus status
    );

    // 내 산책 참여 상태 조회
    Optional<WalkParticipant> findFirstByWalkScheduleIdAndMemberIdOrderByCreatedAtDesc(
            Long walkScheduleId,
            Long memberId
    );

    // 취소 가능한 내 산책 참여 조회
    Optional<WalkParticipant> findFirstByWalkScheduleIdAndMemberIdAndStatusInOrderByCreatedAtDesc(
            Long walkScheduleId,
            Long memberId,
            Collection<WalkParticipantStatus> statuses
    );
}
