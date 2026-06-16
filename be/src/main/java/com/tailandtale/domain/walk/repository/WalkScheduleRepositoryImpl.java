package com.tailandtale.domain.walk.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.entity.PreferredDogSize;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.entity.WalkScheduleStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

import static com.tailandtale.domain.walk.entity.QWalkSchedule.walkSchedule;

// 산책 일정 QueryDSL Repository 구현체

@RequiredArgsConstructor
public class WalkScheduleRepositoryImpl implements WalkScheduleRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    // 산책 일정 검색
    @Override
    public List<WalkSchedule> search(WalkScheduleDto.SearchCondition condition) {
        return queryFactory
                .selectFrom(walkSchedule)
                .where(
                        keywordContains(condition.getKeyword()),
                        regionContains(condition.getRegion()),
                        statusEq(condition.getStatus()),
                        preferredDogSizeEq(condition.getPreferredDogSize()),
                        scheduledAtGoe(condition.getScheduledFrom()),
                        scheduledAtLoe(condition.getScheduledTo())
                )
                .orderBy(walkSchedule.scheduledAt.asc())
                .fetch();
    }

    // 키워드 검색
    private BooleanExpression keywordContains(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }

        return walkSchedule.title.containsIgnoreCase(keyword)
                .or(walkSchedule.description.containsIgnoreCase(keyword))
                .or(walkSchedule.meetingPlace.containsIgnoreCase(keyword));
    }

    // 지역 검색
    private BooleanExpression regionContains(String region) {
        return StringUtils.hasText(region)
                ? walkSchedule.region.containsIgnoreCase(region)
                : null;
    }

    // 상태 필터
    private BooleanExpression statusEq(WalkScheduleStatus status) {
        return status != null ? walkSchedule.status.eq(status) : null;
    }

    // 선호 반려견 크기 필터
    private BooleanExpression preferredDogSizeEq(PreferredDogSize preferredDogSize) {
        return preferredDogSize != null ? walkSchedule.preferredDogSize.eq(preferredDogSize) : null;
    }

    // 산책 시작 일시 필터
    private BooleanExpression scheduledAtGoe(LocalDateTime scheduledFrom) {
        return scheduledFrom != null ? walkSchedule.scheduledAt.goe(scheduledFrom) : null;
    }

    // 산책 종료 일시 필터
    private BooleanExpression scheduledAtLoe(LocalDateTime scheduledTo) {
        return scheduledTo != null ? walkSchedule.scheduledAt.loe(scheduledTo) : null;
    }
}