package com.tailandtale.domain.community.service;

import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.entity.CommunityComment;
import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.repository.CommunityCommentRepository;
import com.tailandtale.domain.community.repository.CommunityPostRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.global.exception.CommunityErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 커뮤니티 댓글 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityCommentService {
    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityPostRepository communityPostRepository;
    private final MemberRepository memberRepository;

    // 댓글 작성
    @Transactional
    public CommunityCommentDto.Response createComment(
            Long memberId,
            Long communityPostId,
            CommunityCommentDto.CreateRequest request
    ) {
        Member member = findMember(memberId);
        CommunityPost post = findPost(communityPostId);
        CommunityComment parentComment = findParentCommentOrNull(request.getParentCommentId(), communityPostId);

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
        findPost(communityPostId);

        return communityCommentRepository.findAllByCommunityPostIdOrderByCreatedAtAsc(communityPostId)
                .stream()
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

        comment.update(request.getContent().trim());

        return CommunityCommentDto.Response.from(comment, memberId);
    }

    // 댓글 삭제
    @Transactional
    public void deleteComment(Long memberId, Long communityPostId, Long commentId) {
        CommunityComment comment = findComment(commentId, communityPostId);

        validateWriter(comment, memberId);

        comment.getCommunityPost().decreaseCommentCount();
        communityCommentRepository.delete(comment);
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

        if (parentComment.getParentComment() != null) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_PARENT_INVALID);
        }

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
}
