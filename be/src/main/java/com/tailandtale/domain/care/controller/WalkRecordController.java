package com.tailandtale.domain.care.controller;

import com.tailandtale.domain.care.dto.WalkRecordDto;
import com.tailandtale.domain.care.service.WalkRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// 산책 기록 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-records")
public class WalkRecordController {
    private final WalkRecordService walkRecordService;

    // 산책 기록 생성
    @PostMapping
    public ResponseEntity<WalkRecordDto.Response> createWalkRecord(
            @Valid @RequestBody WalkRecordDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                walkRecordService.createWalkRecord(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // 산책 기록 목록 조회
    @GetMapping
    public ResponseEntity<List<WalkRecordDto.Response>> getMyWalkRecords(
            @RequestParam(required = false) Long dogId
    ) {
        return ResponseEntity.ok(
                walkRecordService.getMyWalkRecords(
                        getLoginMemberId(),
                        dogId
                )
        );
    }

    // 산책 기록 상세 조회
    @GetMapping("/{walkRecordId}")
    public ResponseEntity<WalkRecordDto.Response> getMyWalkRecord(
            @PathVariable Long walkRecordId
    ) {
        return ResponseEntity.ok(
                walkRecordService.getMyWalkRecord(
                        getLoginMemberId(),
                        walkRecordId
                )
        );
    }

    // 산책 기록 수정
    @PatchMapping("/{walkRecordId}")
    public ResponseEntity<WalkRecordDto.Response> updateWalkRecord(
            @PathVariable Long walkRecordId,
            @Valid @RequestBody WalkRecordDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                walkRecordService.updateWalkRecord(
                        getLoginMemberId(),
                        walkRecordId,
                        request
                )
        );
    }

    // 산책 기록 삭제
    @DeleteMapping("/{walkRecordId}")
    public ResponseEntity<Void> deleteWalkRecord(@PathVariable Long walkRecordId) {
        walkRecordService.deleteWalkRecord(
                getLoginMemberId(),
                walkRecordId
        );

        return ResponseEntity.noContent().build();
    }

    // 산책 기록 통계 조회
    @GetMapping("/summary")
    public ResponseEntity<WalkRecordDto.SummaryResponse> getWalkSummary(
            @RequestParam Long dogId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                walkRecordService.getWalkSummary(
                        getLoginMemberId(),
                        dogId,
                        startDate,
                        endDate
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
