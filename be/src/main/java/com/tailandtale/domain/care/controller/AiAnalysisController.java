package com.tailandtale.domain.care.controller;

import com.tailandtale.domain.care.dto.AiAnalysisDto;
import com.tailandtale.domain.care.service.AiAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// AI 분석 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/care")
public class AiAnalysisController {
    private final AiAnalysisService aiAnalysisService;

    // AI 분석 생성
    @PostMapping("/analyses")
    public ResponseEntity<AiAnalysisDto.Response> createAnalysis(
            @Valid @RequestBody AiAnalysisDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                aiAnalysisService.createAnalysis(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // AI 분석 결과 목록 조회
    @GetMapping("/analyses")
    public ResponseEntity<List<AiAnalysisDto.Response>> getMyAnalyses(
            @RequestParam(required = false) Long dogId
    ) {
        return ResponseEntity.ok(
                aiAnalysisService.getMyAnalyses(
                        getLoginMemberId(),
                        dogId
                )
        );
    }

    // AI 분석 결과 상세 조회
    @GetMapping("/analyses/{aiAnalysisResultId}")
    public ResponseEntity<AiAnalysisDto.Response> getMyAnalysis(
            @PathVariable Long aiAnalysisResultId
    ) {
        return ResponseEntity.ok(
                aiAnalysisService.getMyAnalysis(
                        getLoginMemberId(),
                        aiAnalysisResultId
                )
        );
    }

    // 케어 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<AiAnalysisDto.CareSummaryResponse> getCareSummary(
            @RequestParam Long dogId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                aiAnalysisService.getCareSummary(
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
