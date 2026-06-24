package com.tailandtale.domain.community.controller;

import com.tailandtale.domain.community.dto.CommunityPostDto;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import com.tailandtale.domain.community.service.CommunityPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// 커뮤니티 게시글 CRUD API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/posts")
public class CommunityPostController {
    private final CommunityPostService communityPostService;

    // 게시글 생성
    @PostMapping
    public ResponseEntity<CommunityPostDto.Response> createPost(@RequestBody @Valid CommunityPostDto.CreateRequest request) {
        return ResponseEntity.ok(
                communityPostService.createPost(
                        getLoginMemberId(),
                        request
                )
        );
    }

    // 게시글 목록 조회
    @GetMapping
    public ResponseEntity<CommunityPostDto.PageResponse> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) CommunityPostCategory category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                communityPostService.getPosts(
                        getLoginMemberId(),
                        category,
                        keyword,
                        sort,
                        pageable
                )
        );
    }

    // 게시글 상세 조회
    @GetMapping("/{communityPostId}")
    public ResponseEntity<CommunityPostDto.Response> getPost(@PathVariable Long communityPostId) {
        return ResponseEntity.ok(
                communityPostService.getPost(getLoginMemberId(), communityPostId)
        );
    }

    // 게시글 수정
    @PatchMapping("/{communityPostId}")
    public ResponseEntity<CommunityPostDto.Response> updatePost(
            @PathVariable Long communityPostId,
            @RequestBody @Valid CommunityPostDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(
                communityPostService.updatePost(
                        getLoginMemberId(),
                        communityPostId,
                        request
                )
        );
    }

    // 게시글 삭제
    @DeleteMapping("/{communityPostId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long communityPostId) {
        communityPostService.deletePost(
                getLoginMemberId(),
                communityPostId
        );

        return ResponseEntity.noContent().build();
    }

    // 게시글 좋아요 토글
    @PostMapping("/{communityPostId}/likes")
    public ResponseEntity<CommunityPostDto.Response> toggleLike(@PathVariable Long communityPostId) {
        return ResponseEntity.ok(
                communityPostService.toggleLike(
                        getLoginMemberId(),
                        communityPostId
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
