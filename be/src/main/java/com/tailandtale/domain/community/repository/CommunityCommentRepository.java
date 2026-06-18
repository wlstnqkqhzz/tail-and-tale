package com.tailandtale.domain.community.repository;

import com.tailandtale.domain.community.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 커뮤니티 댓글 Repository

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    // 게시글별 댓글 목록 조회
    List<CommunityComment> findAllByCommunityPostIdOrderByCreatedAtAsc(Long communityPostId);

    // 최근 내가 작성한 댓글 조회
    List<CommunityComment> findTop5ByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 게시글 안의 댓글 단건 조회
    Optional<CommunityComment> findByIdAndCommunityPostId(Long commentId, Long communityPostId);

    // 게시글별 댓글 삭제
    void deleteAllByCommunityPostId(Long communityPostId);
}
