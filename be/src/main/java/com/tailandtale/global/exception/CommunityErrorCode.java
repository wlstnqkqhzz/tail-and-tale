package com.tailandtale.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 커뮤니티 관련 예외 코드 정의 Enum

@Getter
@RequiredArgsConstructor
public enum CommunityErrorCode implements BaseErrorCode {
    COMMUNITY_POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    COMMUNITY_POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "게시글 작성자만 수정하거나 삭제할 수 있습니다."),
    COMMUNITY_NOTICE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "공지는 관리자만 작성할 수 있습니다."),
    COMMUNITY_WALK_REVIEW_REQUIRED(HttpStatus.BAD_REQUEST, "산책 후기 게시글은 연결할 산책 후기를 선택해야 합니다."),
    COMMUNITY_WALK_REVIEW_ACCESS_DENIED(HttpStatus.FORBIDDEN, "본인이 작성한 산책 후기만 연결할 수 있습니다."),
    COMMUNITY_POST_IMAGE_REQUIRED(HttpStatus.BAD_REQUEST, "게시글 이미지를 선택해주세요."),
    COMMUNITY_POST_IMAGE_TOO_LARGE(HttpStatus.BAD_REQUEST, "게시글 이미지는 5MB 이하로 업로드해주세요."),
    COMMUNITY_POST_IMAGE_INVALID_TYPE(HttpStatus.BAD_REQUEST, "게시글 이미지는 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다."),
    COMMUNITY_POST_IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "게시글 이미지 업로드에 실패했습니다."),
    COMMUNITY_POST_IMAGE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "게시글 이미지는 최대 5장까지 첨부할 수 있습니다."),
    COMMUNITY_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    COMMUNITY_COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "댓글 작성자만 수정하거나 삭제할 수 있습니다."),
    COMMUNITY_COMMENT_PARENT_INVALID(HttpStatus.BAD_REQUEST, "대댓글에는 답글을 작성할 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
