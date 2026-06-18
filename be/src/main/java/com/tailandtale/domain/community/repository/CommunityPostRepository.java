package com.tailandtale.domain.community.repository;

import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// 커뮤니티 게시글 Repository

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    // 카테고리별 게시글 목록 조회
    Page<CommunityPost> findAllByCategory(CommunityPostCategory category, Pageable pageable);

    // 커뮤니티 게시글 검색
    @Query(
            value = """
                    select p.*
                    from community_post p
                    join member m on p.member_id = m.member_id
                    where (:category is null or p.category = :category)
                      and (
                            :keyword is null
                            or lower(p.title) like lower(concat('%', :keyword, '%'))
                            or lower(p.content) like lower(concat('%', :keyword, '%'))
                            or lower(m.nickname) like lower(concat('%', :keyword, '%'))
                      )
                    order by
                      case when :sort = 'views' then p.view_count end desc,
                      case when :sort = 'likes' then p.like_count end desc,
                      p.created_at desc
                    """,
            countQuery = """
                    select count(*)
                    from community_post p
                    join member m on p.member_id = m.member_id
                    where (:category is null or p.category = :category)
                      and (
                            :keyword is null
                            or lower(p.title) like lower(concat('%', :keyword, '%'))
                            or lower(p.content) like lower(concat('%', :keyword, '%'))
                            or lower(m.nickname) like lower(concat('%', :keyword, '%'))
                      )
                    """,
            nativeQuery = true
    )
    Page<CommunityPost> search(
            @Param("category") String category,
            @Param("keyword") String keyword,
            @Param("sort") String sort,
            Pageable pageable
    );

    // 최근 내가 작성한 커뮤니티 게시글 조회
    List<CommunityPost> findTop5ByMemberIdOrderByCreatedAtDesc(Long memberId);
}
