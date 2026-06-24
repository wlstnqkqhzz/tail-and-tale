package com.tailandtale.domain.admin.service;

import com.tailandtale.domain.admin.dto.AdminDto;
import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.dto.CommunityPostDto;
import com.tailandtale.domain.community.entity.CommunityComment;
import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.entity.CommunityPostCategory;
import com.tailandtale.domain.community.repository.CommunityCommentRepository;
import com.tailandtale.domain.community.repository.CommunityPostRepository;
import com.tailandtale.domain.community.repository.PostLikeRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberRole;
import com.tailandtale.domain.member.entity.MemberStatus;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.report.dto.ReportDto;
import com.tailandtale.domain.report.entity.ReportStatus;
import com.tailandtale.domain.report.entity.ReportTargetType;
import com.tailandtale.domain.report.service.ReportService;
import com.tailandtale.global.exception.AdminErrorCode;
import com.tailandtale.global.exception.CommunityErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Admin service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {
    private final MemberRepository memberRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final PostLikeRepository postLikeRepository;
    private final ReportService reportService;

    public AdminDto.DashboardResponse getDashboard(Long adminMemberId) {
        validateAdmin(adminMemberId);

        return AdminDto.DashboardResponse.builder()
                .totalMemberCount(memberRepository.count())
                .activeMemberCount(memberRepository.countByStatus(MemberStatus.ACTIVE))
                .bannedMemberCount(memberRepository.countByStatus(MemberStatus.BANNED))
                .communityPostCount(communityPostRepository.count())
                .communityCommentCount(communityCommentRepository.count())
                .pendingReportCount(reportService.countPendingReports())
                .build();
    }

    public AdminDto.MemberPageResponse getMembers(
            Long adminMemberId,
            MemberStatus status,
            String keyword,
            Pageable pageable
    ) {
        validateAdmin(adminMemberId);

        Page<Member> memberPage = memberRepository.searchForAdmin(
                status,
                normalizeKeyword(keyword),
                pageable
        );

        return AdminDto.MemberPageResponse.builder()
                .members(memberPage.getContent().stream()
                        .map(AdminDto.MemberResponse::from)
                        .toList())
                .page(memberPage.getNumber())
                .size(memberPage.getSize())
                .totalElements(memberPage.getTotalElements())
                .totalPages(memberPage.getTotalPages())
                .last(memberPage.isLast())
                .build();
    }

    @Transactional
    public AdminDto.MemberResponse updateMemberStatus(
            Long adminMemberId,
            Long targetMemberId,
            AdminDto.MemberStatusUpdateRequest request
    ) {
        validateAdmin(adminMemberId);

        if (adminMemberId.equals(targetMemberId)) {
            throw new CustomException(AdminErrorCode.ADMIN_SELF_STATUS_CHANGE_DENIED);
        }

        Member member = findMember(targetMemberId);

        if (member.getStatus() == MemberStatus.DELETED) {
            throw new CustomException(AdminErrorCode.DELETED_MEMBER_STATUS_CHANGE_DENIED);
        }

        if (request.getStatus() == MemberStatus.DELETED) {
            throw new CustomException(AdminErrorCode.DELETED_MEMBER_STATUS_CHANGE_DENIED);
        }

        member.changeStatus(request.getStatus());

        return AdminDto.MemberResponse.from(member);
    }

    public AdminDto.CommunityPostPageResponse getCommunityPosts(
            Long adminMemberId,
            CommunityPostCategory category,
            String keyword,
            String sort,
            Pageable pageable
    ) {
        validateAdmin(adminMemberId);

        Page<CommunityPost> postPage = communityPostRepository.search(
                null,
                category == null ? null : category.name(),
                normalizeKeyword(keyword),
                normalizeSort(sort),
                pageable
        );

        return AdminDto.CommunityPostPageResponse.builder()
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

    @Transactional
    public void deleteCommunityPost(Long adminMemberId, Long communityPostId) {
        validateAdmin(adminMemberId);

        CommunityPost post = findPost(communityPostId);

        postLikeRepository.deleteAllByCommunityPostId(communityPostId);
        communityCommentRepository.deleteAllByCommunityPostId(communityPostId);
        communityPostRepository.delete(post);
    }

    public AdminDto.CommunityCommentPageResponse getCommunityComments(
            Long adminMemberId,
            String keyword,
            Pageable pageable
    ) {
        validateAdmin(adminMemberId);

        Page<CommunityComment> commentPage = communityCommentRepository.searchForAdmin(
                normalizeKeyword(keyword),
                pageable
        );

        return AdminDto.CommunityCommentPageResponse.builder()
                .comments(commentPage.getContent().stream()
                        .map(comment -> CommunityCommentDto.Response.from(comment, adminMemberId))
                        .toList())
                .page(commentPage.getNumber())
                .size(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .last(commentPage.isLast())
                .build();
    }

    @Transactional
    public void deleteCommunityComment(Long adminMemberId, Long commentId) {
        validateAdmin(adminMemberId);

        CommunityComment comment = communityCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND));

        if (!Boolean.TRUE.equals(comment.getIsDeleted())) {
            comment.delete();
            comment.getCommunityPost().decreaseCommentCount();
        }
    }

    public AdminDto.ReportPageResponse getReports(
            Long adminMemberId,
            ReportStatus status,
            ReportTargetType targetType,
            Pageable pageable
    ) {
        validateAdmin(adminMemberId);

        return AdminDto.ReportPageResponse.from(
                reportService.getReportsForAdmin(
                        status,
                        targetType,
                        pageable
                )
        );
    }

    @Transactional
    public ReportDto.Response processReport(
            Long adminMemberId,
            Long reportId,
            ReportDto.ProcessRequest request
    ) {
        validateAdmin(adminMemberId);

        return reportService.processReport(
                adminMemberId,
                reportId,
                request
        );
    }

    private Member validateAdmin(Long adminMemberId) {
        Member admin = findMember(adminMemberId);

        if (admin.getRole() != MemberRole.ADMIN) {
            throw new CustomException(AdminErrorCode.ADMIN_ACCESS_DENIED);
        }

        return admin;
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    private CommunityPost findPost(Long communityPostId) {
        return communityPostRepository.findById(communityPostId)
                .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND));
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        return keyword.trim();
    }

    private String normalizeSort(String sort) {
        if ("views".equals(sort) || "likes".equals(sort)) {
            return sort;
        }

        return "latest";
    }
}
