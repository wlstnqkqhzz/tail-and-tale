package com.tailandtale.domain.care.controller;

import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.care.service.HealthRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// 건강 기록 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/health-records")
public class HealthRecordController {
    private final HealthRecordService healthRecordService;

    // 건강 기록 생성
    @PostMapping
    public ResponseEntity<HealthRecordDto.Response> createHealthRecord(
            @Valid @RequestBody HealthRecordDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                healthRecordService.createHealthRecord(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // 건강 기록 목록 조회
    @GetMapping
    public ResponseEntity<List<HealthRecordDto.Response>> getMyHealthRecords(
            @RequestParam(required = false) Long dogId
    ) {
        return ResponseEntity.ok(
                healthRecordService.getMyHealthRecords(
                        getLoginMemberId(),
                        dogId
                )
        );
    }

    // 건강 기록 상세 조회
    @GetMapping("/{healthRecordId}")
    public ResponseEntity<HealthRecordDto.Response> getMyHealthRecord(
            @PathVariable Long healthRecordId
    ) {
        return ResponseEntity.ok(
                healthRecordService.getMyHealthRecord(
                        getLoginMemberId(),
                        healthRecordId
                )
        );
    }

    // 건강 기록 수정
    @PatchMapping("/{healthRecordId}")
    public ResponseEntity<HealthRecordDto.Response> updateHealthRecord(
            @PathVariable Long healthRecordId,
            @Valid @RequestBody HealthRecordDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                healthRecordService.updateHealthRecord(
                        getLoginMemberId(),
                        healthRecordId,
                        request
                )
        );
    }

    // 건강 기록 삭제
    @DeleteMapping("/{healthRecordId}")
    public ResponseEntity<Void> deleteHealthRecord(@PathVariable Long healthRecordId) {
        healthRecordService.deleteHealthRecord(
                getLoginMemberId(),
                healthRecordId
        );

        return ResponseEntity.noContent().build();
    }

    // 건강 통계 조회
    @GetMapping("/summary")
    public ResponseEntity<HealthRecordDto.SummaryResponse> getHealthSummary(
            @RequestParam Long dogId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                healthRecordService.getHealthSummary(
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
