package com.tailandtale.domain.member.dto;

import com.tailandtale.domain.member.entity.MemberBadge;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// 신뢰도 및 뱃지 DTO

public class TrustScoreDto {

    // 신뢰도 요약 응답 DTO
    @Getter
    @Builder
    public static class SummaryResponse {
        private Integer trustScore;
        private String trustLevel;
        private List<BadgeResponse> badges;
    }

    // 뱃지 응답 DTO
    @Getter
    @Builder
    public static class BadgeResponse {
        private Long badgeId;
        private String code;
        private String name;
        private String description;
        private String iconUrl;
        private String earnedReason;
        private LocalDateTime earnedAt;

        public static BadgeResponse from(MemberBadge memberBadge) {
            return BadgeResponse.builder()
                    .badgeId(memberBadge.getBadge().getId())
                    .code(memberBadge.getBadge().getCode().name())
                    .name(memberBadge.getBadge().getName())
                    .description(memberBadge.getBadge().getDescription())
                    .iconUrl(memberBadge.getBadge().getIconUrl())
                    .earnedReason(memberBadge.getEarnedReason())
                    .earnedAt(memberBadge.getEarnedAt())
                    .build();
        }
    }
}
