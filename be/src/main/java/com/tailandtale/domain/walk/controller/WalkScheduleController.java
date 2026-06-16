package com.tailandtale.domain.walk.controller;

import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.service.WalkScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 산책 일정 CRUD API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-schedules")
public class WalkScheduleController {
    private final WalkScheduleService walkScheduleService;

    // 산책 일정 생성
    @PostMapping
    public ResponseEntity<WalkScheduleDto.DetailResponse> createSchedule(@RequestBody @Valid WalkScheduleDto.CreateRequest request) {
        return ResponseEntity.ok(
                walkScheduleService.createSchedule(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // 산책 일정 수정
    @PatchMapping("/{walkScheduleId}")
    public ResponseEntity<WalkScheduleDto.DetailResponse> updateSchedule(@PathVariable Long walkScheduleId, @RequestBody @Valid WalkScheduleDto.UpdateRequest request) {
        return ResponseEntity.ok(
                walkScheduleService.updateSchedule(
                        getLoginMemberId(),
                        walkScheduleId,
                        request
                )
        );
    }

    // 산책 일정 취소
    @PatchMapping("/{walkScheduleId}/cancel")
    public ResponseEntity<WalkScheduleDto.DetailResponse> cancelSchedule(
            @PathVariable Long walkScheduleId
    ) {
        return ResponseEntity.ok(
                walkScheduleService.cancelSchedule(
                        getLoginMemberId(),
                        walkScheduleId
                )
        );
    }

    // 산책 일정 상세 조회
    @GetMapping("/{walkScheduleId}")
    public ResponseEntity<WalkScheduleDto.DetailResponse> getSchedule(@PathVariable Long walkScheduleId) {
        return ResponseEntity.ok(walkScheduleService.getSchedule(walkScheduleId));
    }

    // 산책 일정 목록 조회
    @GetMapping
    public ResponseEntity<List<WalkScheduleDto.DetailResponse>> getSchedules() {
        return ResponseEntity.ok(walkScheduleService.getSchedules());
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
