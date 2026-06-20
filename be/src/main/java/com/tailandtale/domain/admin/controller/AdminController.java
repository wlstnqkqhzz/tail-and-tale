package com.tailandtale.domain.admin.controller;

import com.tailandtale.domain.admin.dto.AdminDto;
import com.tailandtale.domain.admin.service.AdminService;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import com.tailandtale.domain.member.entity.MemberStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// Admin API controller

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDto.DashboardResponse> getDashboard() {
        return ResponseEntity.ok(
                adminService.getDashboard(getLoginMemberId())
        );
    }

    @GetMapping("/members")
    public ResponseEntity<AdminDto.MemberPageResponse> getMembers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) MemberStatus status,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                adminService.getMembers(
                        getLoginMemberId(),
                        status,
                        keyword,
                        pageable
                )
        );
    }

    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<AdminDto.MemberResponse> updateMemberStatus(
            @PathVariable Long memberId,
            @RequestBody @Valid AdminDto.MemberStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(
                adminService.updateMemberStatus(
                        getLoginMemberId(),
                        memberId,
                        request
                )
        );
    }

    @GetMapping("/community/posts")
    public ResponseEntity<AdminDto.CommunityPostPageResponse> getCommunityPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) CommunityPostCategory category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                adminService.getCommunityPosts(
                        getLoginMemberId(),
                        category,
                        keyword,
                        sort,
                        pageable
                )
        );
    }

    @DeleteMapping("/community/posts/{communityPostId}")
    public ResponseEntity<Void> deleteCommunityPost(@PathVariable Long communityPostId) {
        adminService.deleteCommunityPost(
                getLoginMemberId(),
                communityPostId
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/community/comments")
    public ResponseEntity<AdminDto.CommunityCommentPageResponse> getCommunityComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                adminService.getCommunityComments(
                        getLoginMemberId(),
                        keyword,
                        pageable
                )
        );
    }

    @DeleteMapping("/community/comments/{commentId}")
    public ResponseEntity<Void> deleteCommunityComment(@PathVariable Long commentId) {
        adminService.deleteCommunityComment(
                getLoginMemberId(),
                commentId
        );

        return ResponseEntity.noContent().build();
    }

    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
