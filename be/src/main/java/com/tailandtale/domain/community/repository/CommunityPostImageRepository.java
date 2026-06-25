package com.tailandtale.domain.community.repository;

import com.tailandtale.domain.community.entity.CommunityPostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 커뮤니티 게시글 이미지 Repository

public interface CommunityPostImageRepository extends JpaRepository<CommunityPostImage, Long> {

    // 게시글 이미지 목록 조회
    List<CommunityPostImage> findAllByCommunityPostIdOrderBySortOrderAscIdAsc(Long communityPostId);

    // 게시글 대표 이미지 조회
    Optional<CommunityPostImage> findFirstByCommunityPostIdAndIsThumbnailTrueOrderBySortOrderAscIdAsc(Long communityPostId);

    // 게시글 첫 이미지 조회
    Optional<CommunityPostImage> findFirstByCommunityPostIdOrderBySortOrderAscIdAsc(Long communityPostId);

    // 게시글 이미지 수 조회
    long countByCommunityPostId(Long communityPostId);

    // 게시글 이미지 삭제
    void deleteAllByCommunityPostId(Long communityPostId);
}
