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

    // 차단 관계를 제외한 게시글별 댓글 수 조회
    @Query(
            value = """
                    select count(*)
                    from post_comment c
                    where c.community_post_id = :communityPostId
                      and c.is_deleted = false
                      and (
                            :viewerMemberId is null
                            or c.member_id = :viewerMemberId
                            or not exists (
                                select 1
                                from member_block b
                                where b.unblocked_at is null
                                  and (
                                        (b.blocker_member_id = :viewerMemberId and b.blocked_member_id = c.member_id)
                                        or (b.blocker_member_id = c.member_id and b.blocked_member_id = :viewerMemberId)
                                  )
                            )
                      )
                    """,
            nativeQuery = true
    )
    long countVisibleByCommunityPostIdAndViewerMemberId(
            @Param("communityPostId") Long communityPostId,
            @Param("viewerMemberId") Long viewerMemberId
    );

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
