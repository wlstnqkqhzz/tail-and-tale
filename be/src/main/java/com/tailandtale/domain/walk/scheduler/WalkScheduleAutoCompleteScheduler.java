package com.tailandtale.domain.walk.scheduler;

import com.tailandtale.domain.walk.service.WalkScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 산책 일정 자동 완료 Scheduler

@Component
@RequiredArgsConstructor
public class WalkScheduleAutoCompleteScheduler {
    private final WalkScheduleService walkScheduleService;

    // 지난 산책 일정 자동 완료
    @Scheduled(fixedDelay = 60_000)
    public void completeExpiredSchedules() {
        walkScheduleService.completeExpiredSchedules();
    }
}
