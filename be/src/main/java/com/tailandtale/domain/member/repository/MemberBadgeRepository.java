package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.MemberBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 회원 뱃지 Repository

public interface MemberBadgeRepository extends JpaRepository<MemberBadge, Long> {
    // 회원 뱃지 목록 조회
    List<MemberBadge> findAllByMemberIdOrderByEarnedAtDesc(Long memberId);

    // 회원 뱃지 획득 여부 확인
    boolean existsByMemberIdAndBadgeId(Long memberId, Long badgeId);
}
