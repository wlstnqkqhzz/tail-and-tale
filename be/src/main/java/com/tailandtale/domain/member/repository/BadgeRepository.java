package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.Badge;
import com.tailandtale.domain.member.entity.BadgeCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 뱃지 Repository

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    // 활성 뱃지 목록 조회
    List<Badge> findAllByIsActiveTrueOrderByIdAsc();

    // 諭껋? 肄붾뱶濡?議고쉶
    Optional<Badge> findByCode(BadgeCode code);
}
