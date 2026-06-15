package com.tailandtale.domain.walk.repository;

import com.tailandtale.domain.walk.entity.WalkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 산책 스케줄 Repository

public interface WalkScheduleRepository extends JpaRepository<WalkSchedule, Long> {
    List<WalkSchedule> findAllByOrderByScheduledAtAsc();
}
