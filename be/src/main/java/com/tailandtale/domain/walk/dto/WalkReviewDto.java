package com.tailandtale.domain.walk.dto;

import com.tailandtale.domain.walk.entity.WalkReview;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 산책 후기 DTO

public class WalkReviewDto {

    // 산책 후기 생성 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "후기 대상 회원은 필수입니다.")
        private Long revieweeId;

        @NotNull(message = "평점은 필수입니다.")
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하이어야 합니다.")
        private Integer rating;

        @Size(max = 1000, message = "후기 내용은 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 산책 후기 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하이어야 합니다.")
        private Integer rating;

        @Size(max = 1000, message = "후기 내용은 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 산책 후기 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long walkReviewId;
        private Long walkScheduleId;
        private String walkTitle;
        private Long reviewerId;
        private String reviewerNickname;
        private String reviewerProfileImageUrl;
        private Long revieweeId;
        private String revieweeNickname;
        private String revieweeProfileImageUrl;
        private Integer rating;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(WalkReview walkReview) {
            return Response.builder()
                    .walkReviewId(walkReview.getId())
                    .walkScheduleId(walkReview.getWalkSchedule().getId())
                    .walkTitle(walkReview.getWalkSchedule().getTitle())
                    .reviewerId(walkReview.getReviewer().getId())
                    .reviewerNickname(walkReview.getReviewer().getNickname())
                    .reviewerProfileImageUrl(walkReview.getReviewer().getProfileImageUrl())
                    .revieweeId(walkReview.getReviewee().getId())
                    .revieweeNickname(walkReview.getReviewee().getNickname())
                    .revieweeProfileImageUrl(walkReview.getReviewee().getProfileImageUrl())
                    .rating(walkReview.getRating())
                    .content(walkReview.getContent())
                    .createdAt(walkReview.getCreatedAt())
                    .updatedAt(walkReview.getUpdatedAt())
                    .build();
        }
    }
}
