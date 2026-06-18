package com.tailandtale.domain.community.entity;

import com.tailandtale.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 커뮤니티 게시글 좋아요 Entity

@Entity
@Table(
        name = "post_like",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_post_like",
                columnNames = {"community_post_id", "member_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostLike {

    // 좋아요 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_like_id")
    private Long id;

    // 커뮤니티 게시글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id", nullable = false)
    private CommunityPost communityPost;

    // 좋아요 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    private PostLike(CommunityPost communityPost, Member member) {
        this.communityPost = communityPost;
        this.member = member;
    }

    // 좋아요 생성
    public static PostLike create(CommunityPost communityPost, Member member) {
        return new PostLike(
                communityPost,
                member
        );
    }
}
