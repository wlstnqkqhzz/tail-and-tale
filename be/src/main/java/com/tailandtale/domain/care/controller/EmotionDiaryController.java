package com.tailandtale.domain.care.controller;

import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.service.EmotionDiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// 감정 다이어리 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/emotion-diaries")
public class EmotionDiaryController {
    private final EmotionDiaryService emotionDiaryService;

    // 감정 다이어리 생성
    @PostMapping
    public ResponseEntity<EmotionDiaryDto.Response> createEmotionDiary(
            @Valid @RequestBody EmotionDiaryDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                emotionDiaryService.createEmotionDiary(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // 감정 다이어리 목록 조회
    @GetMapping
    public ResponseEntity<List<EmotionDiaryDto.Response>> getMyEmotionDiaries(
            @RequestParam(required = false) Long dogId
    ) {
        return ResponseEntity.ok(
                emotionDiaryService.getMyEmotionDiaries(
                        getLoginMemberId(),
                        dogId
                )
        );
    }

    // 감정 다이어리 상세 조회
    @GetMapping("/{emotionDiaryId}")
    public ResponseEntity<EmotionDiaryDto.Response> getMyEmotionDiary(
            @PathVariable Long emotionDiaryId
    ) {
        return ResponseEntity.ok(
                emotionDiaryService.getMyEmotionDiary(
                        getLoginMemberId(),
                        emotionDiaryId
                )
        );
    }

    // 감정 다이어리 수정
    @PatchMapping("/{emotionDiaryId}")
    public ResponseEntity<EmotionDiaryDto.Response> updateEmotionDiary(
            @PathVariable Long emotionDiaryId,
            @Valid @RequestBody EmotionDiaryDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                emotionDiaryService.updateEmotionDiary(
                        getLoginMemberId(),
                        emotionDiaryId,
                        request
                )
        );
    }

    // 감정 다이어리 삭제
    @DeleteMapping("/{emotionDiaryId}")
    public ResponseEntity<Void> deleteEmotionDiary(@PathVariable Long emotionDiaryId) {
        emotionDiaryService.deleteEmotionDiary(
                getLoginMemberId(),
                emotionDiaryId
        );

        return ResponseEntity.noContent().build();
    }

    // 감정 통계 조회
    @GetMapping("/summary")
    public ResponseEntity<EmotionDiaryDto.SummaryResponse> getEmotionSummary(
            @RequestParam Long dogId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                emotionDiaryService.getEmotionSummary(
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
