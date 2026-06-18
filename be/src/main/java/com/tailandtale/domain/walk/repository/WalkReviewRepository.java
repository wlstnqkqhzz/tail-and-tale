package com.tailandtale.domain.walk.repository;

import com.tailandtale.domain.walk.entity.WalkReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 산책 후기 Repository

public interface WalkReviewRepository extends JpaRepository<WalkReview, Long> {
    // 산책 후기 목록 조회
    List<WalkReview> findAllByWalkScheduleIdOrderByCreatedAtDesc(Long walkScheduleId);

    // 내가 작성한 산책 후기 목록 조회
    List<WalkReview> findAllByReviewerIdOrderByCreatedAtDesc(Long reviewerId);

    // 내가 받은 산책 후기 목록 조회
    List<WalkReview> findAllByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    // 최근 내가 작성한 산책 후기 목록 조회
    List<WalkReview> findTop5ByReviewerIdOrderByCreatedAtDesc(Long reviewerId);

    // 최근 내가 받은 산책 후기 목록 조회
    List<WalkReview> findTop5ByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    // 산책 후기 단건 조회
    Optional<WalkReview> findByIdAndReviewerId(Long walkReviewId, Long reviewerId);

    // 중복 후기 여부 확인
    boolean existsByWalkScheduleIdAndReviewerIdAndRevieweeId(
            Long walkScheduleId,
            Long reviewerId,
            Long revieweeId
    );
}
