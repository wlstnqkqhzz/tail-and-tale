package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.TrustScoreHistory;
import com.tailandtale.domain.member.entity.TrustScoreReasonType;
import com.tailandtale.domain.member.entity.TrustScoreRelatedType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 신뢰도 이력 Repository

public interface TrustScoreHistoryRepository extends JpaRepository<TrustScoreHistory, Long> {
    // 최신 신뢰도 이력 조회
    Optional<TrustScoreHistory> findTopByMemberIdOrderByCreatedAtDescIdDesc(Long memberId);

    // 연결 대상 신뢰도 이력 존재 여부 확인
    boolean existsByReasonTypeAndRelatedTypeAndRelatedId(
            TrustScoreReasonType reasonType,
            TrustScoreRelatedType relatedType,
            Long relatedId
    );

    // 회원별 연결 대상 신뢰도 이력 존재 여부 확인
    boolean existsByMemberIdAndReasonTypeAndRelatedTypeAndRelatedId(
            Long memberId,
            TrustScoreReasonType reasonType,
            TrustScoreRelatedType relatedType,
            Long relatedId
    );
}
