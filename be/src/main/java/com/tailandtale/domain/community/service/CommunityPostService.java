package com.tailandtale.domain.community.service;

import com.tailandtale.domain.community.dto.CommunityPostDto;
import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import com.tailandtale.domain.community.entity.PostLike;
import com.tailandtale.domain.community.repository.CommunityCommentRepository;
import com.tailandtale.domain.community.repository.CommunityPostRepository;
import com.tailandtale.domain.community.repository.PostLikeRepository;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberRole;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.walk.entity.WalkReview;
import com.tailandtale.domain.walk.repository.WalkReviewRepository;
import com.tailandtale.global.exception.CommunityErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 커뮤니티 게시글 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityPostService {
    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final DogRepository dogRepository;
    private final WalkReviewRepository walkReviewRepository;

    // 게시글 생성
    @Transactional
    public CommunityPostDto.Response createPost(Long memberId, CommunityPostDto.CreateRequest request) {
        Member member = findMember(memberId);
        validateNoticePermission(member, request.getCategory());

        Dog dog = findDogOrNull(request.getDogId(), memberId);
        WalkReview walkReview = findWalkReviewOrNull(request.getCategory(), request.getWalkReviewId(), memberId);

        CommunityPost post = CommunityPost.create(
                member,
                dog,
                walkReview,
                request.getCategory(),
                request.getTitle().trim(),
                request.getContent().trim()
        );

        CommunityPost savedPost = communityPostRepository.save(post);

        return CommunityPostDto.Response.from(savedPost, memberId);
    }

    // 게시글 목록 조회
    public CommunityPostDto.PageResponse getPosts(
            CommunityPostCategory category,
            String keyword,
            String sort,
            Pageable pageable
    ) {
        String normalizedKeyword = normalizeKeyword(keyword);
        Page<CommunityPost> postPage = communityPostRepository.search(
                category == null ? null : category.name(),
                normalizedKeyword,
                normalizeSort(sort),
                pageable
        );

        return CommunityPostDto.PageResponse.builder()
                .posts(postPage.getContent().stream()
                        .map(CommunityPostDto.ListResponse::from)
                        .toList())
                .page(postPage.getNumber())
                .size(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .last(postPage.isLast())
                .build();
    }

    // 최근 내가 작성한 게시글 조회
    public List<CommunityPostDto.ListResponse> getRecentMyPosts(Long memberId) {
        return communityPostRepository.findTop5ByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(CommunityPostDto.ListResponse::from)
                .toList();
    }

    // 게시글 상세 조회
    @Transactional
    public CommunityPostDto.Response getPost(Long memberId, Long postId) {
        CommunityPost post = findPost(postId);
        boolean liked = postLikeRepository.existsByCommunityPostIdAndMemberId(postId, memberId);

        post.increaseViewCount();

        return CommunityPostDto.Response.from(post, memberId, liked);
    }

    // 게시글 수정
    @Transactional
    public CommunityPostDto.Response updatePost(Long memberId, Long postId, CommunityPostDto.UpdateRequest request) {
        Member member = findMember(memberId);
        CommunityPost post = findPost(postId);

        validateWriter(post, memberId);
        validateNoticePermission(member, request.getCategory());

        Dog dog = findDogOrNull(request.getDogId(), memberId);
        WalkReview walkReview = findWalkReviewOrNull(request.getCategory(), request.getWalkReviewId(), memberId);

        post.update(
                request.getCategory(),
                dog,
                walkReview,
                request.getTitle().trim(),
                request.getContent().trim()
        );

        boolean liked = postLikeRepository.existsByCommunityPostIdAndMemberId(postId, memberId);

        return CommunityPostDto.Response.from(post, memberId, liked);
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long memberId, Long postId) {
        CommunityPost post = findPost(postId);

        validateWriter(post, memberId);

        postLikeRepository.deleteAllByCommunityPostId(postId);
        communityCommentRepository.deleteAllByCommunityPostId(postId);
        communityPostRepository.delete(post);
    }

    // 게시글 좋아요 토글
    @Transactional
    public CommunityPostDto.Response toggleLike(Long memberId, Long postId) {
        Member member = findMember(memberId);
        CommunityPost post = findPost(postId);

        postLikeRepository.findByCommunityPostIdAndMemberId(postId, memberId)
                .ifPresentOrElse(
                        postLike -> {
                            postLikeRepository.delete(postLike);
                            post.decreaseLikeCount();
                        },
                        () -> {
                            postLikeRepository.save(PostLike.create(post, member));
                            post.increaseLikeCount();
                        }
                );

        boolean liked = postLikeRepository.existsByCommunityPostIdAndMemberId(postId, memberId);

        return CommunityPostDto.Response.from(post, memberId, liked);
    }

    // 회원 조회
    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    // 게시글 조회
    private CommunityPost findPost(Long postId) {
        return communityPostRepository.findById(postId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND));
    }

    // 반려견 조회
    private Dog findDogOrNull(Long dogId, Long memberId) {
        if (dogId == null) {
            return null;
        }

        Dog dog = dogRepository.findById(dogId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));

        if (!dog.getMember().getId().equals(memberId)) {
            throw new CustomException(DogErrorCode.DOG_ACCESS_DENIED);
        }

        return dog;
    }

    // 연결 산책 후기 조회
    private WalkReview findWalkReviewOrNull(
            CommunityPostCategory category,
            Long walkReviewId,
            Long memberId
    ) {
        if (category != CommunityPostCategory.WALK_REVIEW) {
            return null;
        }

        if (walkReviewId == null) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_WALK_REVIEW_REQUIRED);
        }

        return walkReviewRepository.findByIdAndReviewerId(walkReviewId, memberId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_WALK_REVIEW_ACCESS_DENIED));
    }

    // 작성자 검증
    private void validateWriter(CommunityPost post, Long memberId) {
        if (!post.isWriter(memberId)) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_ACCESS_DENIED);
        }
    }

    // 공지 작성 권한 검증
    private void validateNoticePermission(Member member, CommunityPostCategory category) {
        if (category == CommunityPostCategory.NOTICE && member.getRole() != MemberRole.ADMIN) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_NOTICE_ACCESS_DENIED);
        }
    }

    // 검색어 정리
    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        return keyword.trim();
    }

    // 정렬 조건 정리
    private String normalizeSort(String sort) {
        if ("views".equals(sort) || "likes".equals(sort)) {
            return sort;
        }

        return "latest";
    }
}
