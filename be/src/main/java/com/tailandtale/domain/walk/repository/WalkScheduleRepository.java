package com.tailandtale.domain.walk.repository;

import com.tailandtale.domain.walk.entity.WalkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 산책 스케줄 Repository

public interface WalkScheduleRepository extends JpaRepository<WalkSchedule, Long>, WalkScheduleRepositoryCustom {
    // 내가 작성한 산책 일정 목록 조회
    List<WalkSchedule> findAllByHostMemberIdOrderByCreatedAtDesc(Long memberId);
}
