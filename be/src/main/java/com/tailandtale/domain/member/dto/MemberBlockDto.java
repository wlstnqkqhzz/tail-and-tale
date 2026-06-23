package com.tailandtale.domain.member.dto;

import com.tailandtale.domain.member.entity.MemberBlock;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 회원 차단 DTO

public class MemberBlockDto {

    // 회원 차단 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class Request {

        @Size(max = 300, message = "차단 사유는 300자 이하로 입력해주세요.")
        private String reason;
    }

    // 회원 차단 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long memberBlockId;
        private Long blockedMemberId;
        private String blockedNickname;
        private String blockedProfileImageUrl;
        private String reason;
        private LocalDateTime blockedAt;

        public static Response from(MemberBlock memberBlock) {
            return Response.builder()
                    .memberBlockId(memberBlock.getId())
                    .blockedMemberId(memberBlock.getBlockedMember().getId())
                    .blockedNickname(memberBlock.getBlockedMember().getNickname())
                    .blockedProfileImageUrl(memberBlock.getBlockedMember().getProfileImageUrl())
                    .reason(memberBlock.getReason())
                    .blockedAt(memberBlock.getBlockedAt())
                    .build();
        }
    }
}
