package com.tailandtale.domain.walk.controller;

import com.tailandtale.domain.walk.dto.WalkParticipantDto;
import com.tailandtale.domain.walk.service.WalkParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 산책 참여 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-schedules")
public class WalkParticipantController {
    private final WalkParticipantService walkParticipantService;

    // 산책 참여 신청
    @PostMapping("/{walkScheduleId}/participants")
    public ResponseEntity<WalkParticipantDto.Response> requestWalk(@PathVariable Long walkScheduleId, @RequestBody @Valid WalkParticipantDto.Request request) {
        return ResponseEntity.ok(
                walkParticipantService.requestWalk(
                        getLoginMemberId(),
                        walkScheduleId,
                        request
                )
        );
    }

    // 산책 참여 승인
    @PatchMapping("/{walkScheduleId}/participants/{walkParticipantId}/approve")
    public ResponseEntity<WalkParticipantDto.Response> approveWalk(@PathVariable Long walkScheduleId, @PathVariable Long walkParticipantId) {
        return ResponseEntity.ok(
                walkParticipantService.approveWalk(
                        getLoginMemberId(),
                        walkScheduleId,
                        walkParticipantId
                )
        );
    }

    // 산책 참여 거절
    @PatchMapping("/{walkScheduleId}/participants/{walkParticipantId}/reject")
    public ResponseEntity<WalkParticipantDto.Response> rejectWalk(@PathVariable Long walkScheduleId, @PathVariable Long walkParticipantId) {
        return ResponseEntity.ok(
                walkParticipantService.rejectWalk(
                        getLoginMemberId(),
                        walkScheduleId,
                        walkParticipantId
                )
        );
    }

    // 산책 참여 취소
    @PatchMapping("/{walkScheduleId}/participants/{walkParticipantId}/cancel")
    public ResponseEntity<WalkParticipantDto.Response> cancelWalk(@PathVariable Long walkScheduleId, @PathVariable Long walkParticipantId) {
        return ResponseEntity.ok(
                walkParticipantService.cancelWalk(
                        getLoginMemberId(),
                        walkScheduleId,
                        walkParticipantId
                )
        );
    }

    // 내 산책 참여 취소
    @PatchMapping("/{walkScheduleId}/participants/me/cancel")
    public ResponseEntity<WalkParticipantDto.Response> cancelMyWalk(@PathVariable Long walkScheduleId) {
        return ResponseEntity.ok(
                walkParticipantService.cancelMyWalk(
                        getLoginMemberId(),
                        walkScheduleId
                )
        );
    }

    // 참여자 목록 조회
    @GetMapping("/{walkScheduleId}/participants")
    public ResponseEntity<List<WalkParticipantDto.Response>> getParticipants(@PathVariable Long walkScheduleId) {
        return ResponseEntity.ok(
                walkParticipantService.getParticipants(
                        walkScheduleId
                )
        );
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
