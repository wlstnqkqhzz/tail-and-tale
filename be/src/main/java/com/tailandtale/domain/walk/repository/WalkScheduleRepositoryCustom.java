package com.tailandtale.domain.walk.repository;

import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.entity.WalkSchedule;

import java.util.List;

// 산책 일정 QueryDSL Repository

public interface WalkScheduleRepositoryCustom {

    // 산책 일정 검색
    List<WalkSchedule> search(WalkScheduleDto.SearchCondition condition);
}