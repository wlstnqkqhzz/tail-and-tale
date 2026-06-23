package com.tailandtale.domain.member.controller;

import com.tailandtale.domain.member.dto.MemberBlockDto;
import com.tailandtale.domain.member.service.MemberBlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 회원 차단 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members")
public class MemberBlockController {
    private final MemberBlockService memberBlockService;

    // 내 차단 목록 조회
    @GetMapping("/blocks")
    public ResponseEntity<List<MemberBlockDto.Response>> getMyBlocks() {
        return ResponseEntity.ok(
                memberBlockService.getMyBlocks(
                        getLoginMemberId()
                )
        );
    }

    // 회원 차단
    @PostMapping("/{memberId}/block")
    public ResponseEntity<MemberBlockDto.Response> blockMember(
            @PathVariable Long memberId,
            @Valid @RequestBody MemberBlockDto.Request request
    ) {
        return ResponseEntity.ok(
                memberBlockService.blockMember(
                        getLoginMemberId(),
                        memberId,
                        request
                )
        );
    }

    // 회원 차단 해제
    @DeleteMapping("/{memberId}/block")
    public ResponseEntity<Void> unblockMember(@PathVariable Long memberId) {
        memberBlockService.unblockMember(
                getLoginMemberId(),
                memberId
        );

        return ResponseEntity.ok().build();
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
