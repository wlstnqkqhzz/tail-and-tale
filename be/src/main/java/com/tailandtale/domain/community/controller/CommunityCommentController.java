package com.tailandtale.domain.community.controller;

import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.service.CommunityCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// 커뮤니티 댓글 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/posts/{communityPostId}/comments")
public class CommunityCommentController {
    private final CommunityCommentService communityCommentService;

    // 댓글 작성
    @PostMapping
    public ResponseEntity<CommunityCommentDto.Response> createComment(
            @PathVariable Long communityPostId,
            @RequestBody @Valid CommunityCommentDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                communityCommentService.createComment(
                        getLoginMemberId(),
                        communityPostId,
                        request
                )
        );
    }

    // 댓글 목록 조회
    @GetMapping
    public ResponseEntity<CommunityCommentDto.PageResponse> getComments(
            @PathVariable Long communityPostId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                communityCommentService.getComments(
                        getLoginMemberId(),
                        communityPostId,
                        pageable
                )
        );
    }

    // 댓글 수정
    @PatchMapping("/{commentId}")
    public ResponseEntity<CommunityCommentDto.Response> updateComment(
            @PathVariable Long communityPostId,
            @PathVariable Long commentId,
            @RequestBody @Valid CommunityCommentDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                communityCommentService.updateComment(
                        getLoginMemberId(),
                        communityPostId,
                        commentId,
                        request
                )
        );
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long communityPostId,
            @PathVariable Long commentId
    ) {
        communityCommentService.deleteComment(
                getLoginMemberId(),
                communityPostId,
                commentId
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
