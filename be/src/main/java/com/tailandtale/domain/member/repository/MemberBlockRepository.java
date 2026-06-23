package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.MemberBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 회원 차단 Repository

public interface MemberBlockRepository extends JpaRepository<MemberBlock, Long> {

    // 내 차단 목록 조회
    List<MemberBlock> findAllByBlockerMemberIdAndUnblockedAtIsNullOrderByBlockedAtDesc(Long blockerMemberId);

    // 회원 차단 관계 조회
    Optional<MemberBlock> findByBlockerMemberIdAndBlockedMemberId(Long blockerMemberId, Long blockedMemberId);

    // 활성 차단 여부 조회
    boolean existsByBlockerMemberIdAndBlockedMemberIdAndUnblockedAtIsNull(Long blockerMemberId, Long blockedMemberId);
}
