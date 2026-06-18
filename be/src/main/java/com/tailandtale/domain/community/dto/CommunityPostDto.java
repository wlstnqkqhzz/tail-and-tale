package com.tailandtale.domain.community.dto;

import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// 커뮤니티 게시글 DTO

public class CommunityPostDto {

    // 게시글 생성 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {

        // 관련 반려견 ID
        private Long dogId;

        // 게시글 카테고리
        @NotNull(message = "게시글 카테고리를 선택해주세요.")
        private CommunityPostCategory category;

        // 게시글 제목
        @NotBlank(message = "게시글 제목을 입력해주세요.")
        @Size(max = 150, message = "게시글 제목은 150자 이하로 입력해주세요.")
        private String title;

        // 게시글 내용
        @NotBlank(message = "게시글 내용을 입력해주세요.")
        private String content;
    }

    // 게시글 수정 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        // 관련 반려견 ID
        private Long dogId;

        // 게시글 카테고리
        @NotNull(message = "게시글 카테고리를 선택해주세요.")
        private CommunityPostCategory category;

        // 게시글 제목
        @NotBlank(message = "게시글 제목을 입력해주세요.")
        @Size(max = 150, message = "게시글 제목은 150자 이하로 입력해주세요.")
        private String title;

        // 게시글 내용
        @NotBlank(message = "게시글 내용을 입력해주세요.")
        private String content;
    }

    // 게시글 목록 응답 DTO
    @Getter
    @Builder
    public static class ListResponse {
        private Long communityPostId;
        private Long memberId;
        private String nickname;
        private Long dogId;
        private String dogName;
        private CommunityPostCategory category;
        private String title;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private LocalDateTime createdAt;

        public static ListResponse from(CommunityPost post) {
            return ListResponse.builder()
                    .communityPostId(post.getId())
                    .memberId(post.getMember().getId())
                    .nickname(post.getMember().getNickname())
                    .dogId(post.getDog() == null ? null : post.getDog().getId())
                    .dogName(post.getDog() == null ? null : post.getDog().getName())
                    .category(post.getCategory())
                    .title(post.getTitle())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }

    // 게시글 상세 응답 DTO
    @Getter
    @Builder
    public static class Response {
        private Long communityPostId;
        private Long memberId;
        private String nickname;
        private Long dogId;
        private String dogName;
        private CommunityPostCategory category;
        private String title;
        private String content;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private Boolean isLiked;
        private Boolean isWriter;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(CommunityPost post, Long loginMemberId) {
            return from(post, loginMemberId, false);
        }

        public static Response from(CommunityPost post, Long loginMemberId, Boolean isLiked) {
            return Response.builder()
                    .communityPostId(post.getId())
                    .memberId(post.getMember().getId())
                    .nickname(post.getMember().getNickname())
                    .dogId(post.getDog() == null ? null : post.getDog().getId())
                    .dogName(post.getDog() == null ? null : post.getDog().getName())
                    .category(post.getCategory())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .isLiked(isLiked)
                    .isWriter(post.isWriter(loginMemberId))
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }
    }

    // 게시글 목록 페이지 응답 DTO
    @Getter
    @Builder
    public static class PageResponse {
        private List<ListResponse> posts;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
