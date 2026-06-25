package com.tailandtale.domain.community.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 커뮤니티 게시글 이미지 Entity

@Entity
@Table(name = "post_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPostImage extends BaseEntity {

    // 게시글 이미지 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_image_id")
    private Long id;

    // 커뮤니티 게시글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id", nullable = false)
    private CommunityPost communityPost;

    // 이미지 URL
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    // 원본 파일명
    @Column(name = "original_file_name")
    private String originalFileName;

    // 저장 파일명
    @Column(name = "stored_file_name")
    private String storedFileName;

    // 이미지 Content-Type
    @Column(name = "content_type", length = 100)
    private String contentType;

    // 이미지 파일 크기
    @Column(name = "file_size")
    private Long fileSize;

    // 이미지 표시 순서
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    // 대표 썸네일 여부
    @Column(name = "is_thumbnail", nullable = false)
    private Boolean isThumbnail;

    private CommunityPostImage(
            CommunityPost communityPost,
            String imageUrl,
            String originalFileName,
            String storedFileName,
            String contentType,
            Long fileSize,
            Integer sortOrder,
            Boolean isThumbnail
    ) {
        this.communityPost = communityPost;
        this.imageUrl = imageUrl;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.sortOrder = sortOrder == null ? 0 : sortOrder;
        this.isThumbnail = Boolean.TRUE.equals(isThumbnail);
    }

    // 게시글 이미지 생성
    public static CommunityPostImage create(
            CommunityPost communityPost,
            String imageUrl,
            String originalFileName,
            String storedFileName,
            String contentType,
            Long fileSize,
            Integer sortOrder,
            Boolean isThumbnail
    ) {
        return new CommunityPostImage(
                communityPost,
                imageUrl,
                originalFileName,
                storedFileName,
                contentType,
                fileSize,
                sortOrder,
                isThumbnail
        );
    }
}
