package com.tailandtale.domain.admin.dto;

import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.dto.CommunityPostDto;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberRole;
import com.tailandtale.domain.member.entity.MemberStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// 관리자 요청 및 응답 DTO

public class AdminDto {

    // 관리자 대시보드 응답
    @Getter
    @Builder
    public static class DashboardResponse {
        private long totalMemberCount;
        private long activeMemberCount;
        private long bannedMemberCount;
        private long communityPostCount;
        private long communityCommentCount;
    }

    // 관리자 회원 목록 응답
    @Getter
    @Builder
    public static class MemberPageResponse {
        private List<MemberResponse> members;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }

    // 관리자 회원 단건 응답
    @Getter
    @Builder
    public static class MemberResponse {
        private Long memberId;
        private String email;
        private String realName;
        private String nickname;
        private String phoneNumber;
        private String region;
        private MemberRole role;
        private MemberStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static MemberResponse from(Member member) {
            return MemberResponse.builder()
                    .memberId(member.getId())
                    .email(member.getEmail())
                    .realName(member.getRealName())
                    .nickname(member.getNickname())
                    .phoneNumber(member.getPhoneNumber())
                    .region(member.getRegion())
                    .role(member.getRole())
                    .status(member.getStatus())
                    .createdAt(member.getCreatedAt())
                    .updatedAt(member.getUpdatedAt())
                    .build();
        }
    }

    // 회원 상태 변경 요청
    @Getter
    @NoArgsConstructor
    public static class MemberStatusUpdateRequest {
        @NotNull(message = "변경할 회원 상태를 선택해주세요.")
        private MemberStatus status;
    }

    // 관리자 게시글 목록 응답
    @Getter
    @Builder
    public static class CommunityPostPageResponse {
        private List<CommunityPostDto.ListResponse> posts;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }

    // 관리자 댓글 목록 응답
    @Getter
    @Builder
    public static class CommunityCommentPageResponse {
        private List<CommunityCommentDto.Response> comments;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
