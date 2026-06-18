package com.tailandtale.domain.community.repository;

import com.tailandtale.domain.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 커뮤니티 게시글 좋아요 Repository

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    // 회원별 좋아요 조회
    Optional<PostLike> findByCommunityPostIdAndMemberId(Long communityPostId, Long memberId);

    // 회원별 좋아요 여부 확인
    boolean existsByCommunityPostIdAndMemberId(Long communityPostId, Long memberId);

    // 게시글별 좋아요 삭제
    void deleteAllByCommunityPostId(Long communityPostId);
}
