package com.tailandtale.domain.community.dto;

import com.tailandtale.domain.community.entity.CommunityComment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 커뮤니티 댓글 DTO

public class CommunityCommentDto {

    // 댓글 작성 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        // 부모 댓글 ID
        private Long parentCommentId;

        // 댓글 내용
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        @Size(max = 1000, message = "댓글은 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 댓글 수정 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        // 댓글 내용
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        @Size(max = 1000, message = "댓글은 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 댓글 응답 DTO
    @Getter
    @Builder
    public static class Response {
        private Long commentId;
        private Long communityPostId;
        private String communityPostTitle;
        private Long memberId;
        private String nickname;
        private String profileImageUrl;
        private Long parentCommentId;
        private String parentNickname;
        private String content;
        private Boolean isDeleted;
        private Boolean isWriter;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(CommunityComment comment, Long loginMemberId) {
            boolean deleted = Boolean.TRUE.equals(comment.getIsDeleted());

            return Response.builder()
                    .commentId(comment.getId())
                    .communityPostId(comment.getCommunityPost().getId())
                    .communityPostTitle(comment.getCommunityPost().getTitle())
                    .memberId(comment.getMember().getId())
                    .nickname(comment.getMember().getNickname())
                    .profileImageUrl(comment.getMember().getProfileImageUrl())
                    .parentCommentId(comment.getParentComment() == null ? null : comment.getParentComment().getId())
                    .parentNickname(comment.getParentComment() == null ? null : comment.getParentComment().getMember().getNickname())
                    .content(deleted ? "삭제된 댓글입니다." : comment.getContent())
                    .isDeleted(deleted)
                    .isWriter(!deleted && comment.isWriter(loginMemberId))
                    .createdAt(comment.getCreatedAt())
                    .updatedAt(comment.getUpdatedAt())
                    .build();
        }
    }
}
