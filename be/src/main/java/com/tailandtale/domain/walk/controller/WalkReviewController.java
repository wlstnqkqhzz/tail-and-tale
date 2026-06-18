package com.tailandtale.domain.walk.controller;

import com.tailandtale.domain.walk.dto.WalkReviewDto;
import com.tailandtale.domain.walk.service.WalkReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 산책 후기 API 컨트롤러

@RestController
@RequiredArgsConstructor
public class WalkReviewController {
    private final WalkReviewService walkReviewService;

    // 산책 후기 작성
    @PostMapping("/api/walk-schedules/{walkScheduleId}/reviews")
    public ResponseEntity<WalkReviewDto.Response> createReview(
            @PathVariable Long walkScheduleId,
            @RequestBody @Valid WalkReviewDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                walkReviewService.createReview(
                        getLoginMemberId(),
                        walkScheduleId,
                        request
                )
        );
    }

    // 산책 후기 목록 조회
    @GetMapping("/api/walk-schedules/{walkScheduleId}/reviews")
    public ResponseEntity<List<WalkReviewDto.Response>> getScheduleReviews(
            @PathVariable Long walkScheduleId
    ) {
        return ResponseEntity.ok(
                walkReviewService.getScheduleReviews(walkScheduleId)
        );
    }

    // 내가 작성한 산책 후기 조회
    @GetMapping("/api/walk-reviews/me/written")
    public ResponseEntity<List<WalkReviewDto.Response>> getMyWrittenReviews() {
        return ResponseEntity.ok(
                walkReviewService.getMyWrittenReviews(getLoginMemberId())
        );
    }

    // 내가 받은 산책 후기 조회
    @GetMapping("/api/walk-reviews/me/received")
    public ResponseEntity<List<WalkReviewDto.Response>> getMyReceivedReviews() {
        return ResponseEntity.ok(
                walkReviewService.getMyReceivedReviews(getLoginMemberId())
        );
    }

    // 산책 후기 수정
    @PatchMapping("/api/walk-reviews/{walkReviewId}")
    public ResponseEntity<WalkReviewDto.Response> updateReview(
            @PathVariable Long walkReviewId,
            @RequestBody @Valid WalkReviewDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                walkReviewService.updateReview(
                        getLoginMemberId(),
                        walkReviewId,
                        request
                )
        );
    }

    // 산책 후기 삭제
    @DeleteMapping("/api/walk-reviews/{walkReviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long walkReviewId) {
        walkReviewService.deleteReview(
                getLoginMemberId(),
                walkReviewId
        );

        return ResponseEntity.noContent().build();
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
