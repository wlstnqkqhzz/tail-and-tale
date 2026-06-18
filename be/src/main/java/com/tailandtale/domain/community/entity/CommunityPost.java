package com.tailandtale.domain.community.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.walk.entity.WalkReview;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 커뮤니티 게시글 Entity

@Entity
@Table(name = "community_post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPost extends BaseEntity {
    // 커뮤니티 게시글 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "community_post_id")
    private Long id;

    // 작성 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 관련 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id")
    private Dog dog;

    // 연결 산책 후기
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_review_id")
    private WalkReview walkReview;

    // 게시글 카테고리
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunityPostCategory category;

    // 게시글 제목
    @Column(nullable = false, length = 150)
    private String title;

    // 게시글 내용
    @Lob
    @Column(nullable = false)
    private String content;

    // 조회수
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    // 좋아요 수
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    // 댓글 수
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    // 게시글 생성
    private CommunityPost(
            Member member,
            Dog dog,
            WalkReview walkReview,
            CommunityPostCategory category,
            String title,
            String content
    ) {
        this.member = member;
        this.dog = dog;
        this.walkReview = walkReview;
        this.category = category;
        this.title = title;
        this.content = content;
        this.viewCount = 0;
        this.likeCount = 0;
        this.commentCount = 0;
    }

    // 게시글 생성
    public static CommunityPost create(
            Member member,
            Dog dog,
            WalkReview walkReview,
            CommunityPostCategory category,
            String title,
            String content
    ) {
        return new CommunityPost(
                member,
                dog,
                walkReview,
                category,
                title,
                content
        );
    }

    // 게시글 수정
    public void update(
            CommunityPostCategory category,
            Dog dog,
            WalkReview walkReview,
            String title,
            String content
    ) {
        this.category = category;
        this.dog = dog;
        this.walkReview = walkReview;
        this.title = title;
        this.content = content;
    }

    // 조회수 증가
    public void increaseViewCount() {
        this.viewCount++;
    }

    // 좋아요 수 증가
    public void increaseLikeCount() {
        this.likeCount++;
    }

    // 좋아요 수 감소
    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    // 댓글 수 증가
    public void increaseCommentCount() {
        this.commentCount++;
    }

    // 댓글 수 감소
    public void decreaseCommentCount() {
        if (this.commentCount > 0) {
            this.commentCount--;
        }
    }

    // 작성자 여부 확인
    public boolean isWriter(Long memberId) {
        return this.member.getId().equals(memberId);
    }
}
