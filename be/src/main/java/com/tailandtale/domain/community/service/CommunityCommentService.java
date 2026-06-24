package com.tailandtale.domain.community.service;

import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.entity.CommunityComment;
import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.repository.CommunityCommentRepository;
import com.tailandtale.domain.community.repository.CommunityPostRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.service.MemberBlockService;
import com.tailandtale.global.exception.CommunityErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.HashSet;
import java.util.Set;

// 커뮤니티 댓글 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityCommentService {
    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityPostRepository communityPostRepository;
    private final MemberRepository memberRepository;
    private final MemberBlockService memberBlockService;

    // 댓글 작성
    @Transactional
    public CommunityCommentDto.Response createComment(
            Long memberId,
            Long communityPostId,
            CommunityCommentDto.CreateRequest request
    ) {
        Member member = findMember(memberId);
        CommunityPost post = findPost(communityPostId);
        validateVisiblePost(post, memberId);

        CommunityComment parentComment = findParentCommentOrNull(request.getParentCommentId(), communityPostId);
        validateVisibleParentComment(parentComment, memberId);

        CommunityComment comment = CommunityComment.create(
                post,
                member,
                parentComment,
                request.getContent().trim()
        );

        post.increaseCommentCount();

        return CommunityCommentDto.Response.from(
                communityCommentRepository.save(comment),
                memberId
        );
    }

    // 댓글 목록 조회
    public List<CommunityCommentDto.Response> getComments(Long memberId, Long communityPostId) {
        CommunityPost post = findPost(communityPostId);
        validateVisiblePost(post, memberId);

        Set<Long> hiddenCommentIds = new HashSet<>();
        return communityCommentRepository.findAllByCommunityPostIdOrderByCreatedAtAsc(communityPostId)
                .stream()
                .filter(comment -> isVisibleComment(comment, memberId, hiddenCommentIds))
                .map(comment -> CommunityCommentDto.Response.from(comment, memberId))
                .toList();
    }

    // 최근 내가 작성한 댓글 조회
    public List<CommunityCommentDto.Response> getRecentMyComments(Long memberId) {
        return communityCommentRepository.findTop5ByMemberIdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(comment -> CommunityCommentDto.Response.from(comment, memberId))
                .toList();
    }

    // 댓글 수정
    @Transactional
    public CommunityCommentDto.Response updateComment(
            Long memberId,
            Long communityPostId,
            Long commentId,
            CommunityCommentDto.UpdateRequest request
    ) {
        CommunityComment comment = findComment(commentId, communityPostId);

        validateWriter(comment, memberId);
        validateNotDeleted(comment);

        comment.update(request.getContent().trim());

        return CommunityCommentDto.Response.from(comment, memberId);
    }

    // 댓글 삭제
    @Transactional
    public void deleteComment(Long memberId, Long communityPostId, Long commentId) {
        CommunityComment comment = findComment(commentId, communityPostId);

        validateWriter(comment, memberId);

        if (!Boolean.TRUE.equals(comment.getIsDeleted())) {
            comment.delete();
            comment.getCommunityPost().decreaseCommentCount();
        }
    }

    // 회원 조회
    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    // 게시글 조회
    private CommunityPost findPost(Long communityPostId) {
        return communityPostRepository.findById(communityPostId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND));
    }

    // 부모 댓글 조회
    private CommunityComment findParentCommentOrNull(Long parentCommentId, Long communityPostId) {
        if (parentCommentId == null) {
            return null;
        }

        CommunityComment parentComment = findComment(parentCommentId, communityPostId);

        validateNotDeleted(parentComment);

        return parentComment;
    }

    // 댓글 조회
    private CommunityComment findComment(Long commentId, Long communityPostId) {
        return communityCommentRepository.findByIdAndCommunityPostId(commentId, communityPostId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND));
    }

    // 작성자 검증
    private void validateWriter(CommunityComment comment, Long memberId) {
        if (!comment.isWriter(memberId)) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_ACCESS_DENIED);
        }
    }

    // 삭제된 댓글 여부 검증
    private void validateNotDeleted(CommunityComment comment) {
        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND);
        }
    }

    // 차단 관계 게시글 노출 여부 검증
    private void validateVisiblePost(CommunityPost post, Long memberId) {
        if (post.isWriter(memberId)) {
            return;
        }

        if (memberBlockService.isBlockedBetween(memberId, post.getMember().getId())) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND);
        }
    }

    // 차단 관계 부모 댓글 검증
    private void validateVisibleParentComment(CommunityComment parentComment, Long memberId) {
        if (parentComment == null || parentComment.isWriter(memberId)) {
            return;
        }

        if (memberBlockService.isBlockedBetween(memberId, parentComment.getMember().getId())) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND);
        }
    }

    // 차단 관계 댓글 노출 여부 확인
    private boolean isVisibleComment(CommunityComment comment, Long memberId, Set<Long> hiddenCommentIds) {
        boolean hiddenParent = comment.getParentComment() != null
                && hiddenCommentIds.contains(comment.getParentComment().getId());
        boolean hiddenWriter = !comment.isWriter(memberId)
                && memberBlockService.isBlockedBetween(memberId, comment.getMember().getId());

        if (hiddenParent || hiddenWriter) {
            hiddenCommentIds.add(comment.getId());
            return false;
        }

        return true;
    }
}
