package com.tailandtale.domain.community.repository;

import com.tailandtale.domain.community.entity.CommunityComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // 대댓글 목록 조회
    List<CommunityComment> findAllByParentCommentId(Long parentCommentId);

    // 게시글별 댓글 삭제
    void deleteAllByCommunityPostId(Long communityPostId);

    // 관리자 댓글 검색
    @Query("""
            select c
            from CommunityComment c
            join c.communityPost p
            join c.member m
            where (
                    :keyword is null
                    or lower(c.content) like lower(concat('%', :keyword, '%'))
                    or lower(p.title) like lower(concat('%', :keyword, '%'))
                    or lower(m.nickname) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<CommunityComment> searchForAdmin(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
