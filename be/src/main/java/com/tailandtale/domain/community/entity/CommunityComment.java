package com.tailandtale.domain.community.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 커뮤니티 댓글 Entity

@Entity
@Table(name = "post_comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityComment extends BaseEntity {

    // 댓글 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_comment_id")
    private Long id;

    // 커뮤니티 게시글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id", nullable = false)
    private CommunityPost communityPost;

    // 작성 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 부모 댓글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private CommunityComment parentComment;

    // 댓글 내용
    @Column(nullable = false, length = 1000)
    private String content;

    private CommunityComment(
            CommunityPost communityPost,
            Member member,
            CommunityComment parentComment,
            String content
    ) {
        this.communityPost = communityPost;
        this.member = member;
        this.parentComment = parentComment;
        this.content = content;
    }

    // 댓글 생성
    public static CommunityComment create(
            CommunityPost communityPost,
            Member member,
            CommunityComment parentComment,
            String content
    ) {
        return new CommunityComment(
                communityPost,
                member,
                parentComment,
                content
        );
    }

    // 댓글 수정
    public void update(String content) {
        this.content = content;
    }

    // 작성자 여부 확인
    public boolean isWriter(Long memberId) {
        return this.member.getId().equals(memberId);
    }
}
