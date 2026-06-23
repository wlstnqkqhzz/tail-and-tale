package com.tailandtale.domain.report.service;

import com.tailandtale.domain.chat.entity.ChatMessage;
import com.tailandtale.domain.chat.entity.ChatRoom;
import com.tailandtale.domain.chat.entity.ChatRoomMemberStatus;
import com.tailandtale.domain.chat.repository.ChatMessageRepository;
import com.tailandtale.domain.chat.repository.ChatRoomMemberRepository;
import com.tailandtale.domain.chat.repository.ChatRoomRepository;
import com.tailandtale.domain.community.entity.CommunityComment;
import com.tailandtale.domain.community.entity.CommunityPost;
import com.tailandtale.domain.community.repository.CommunityCommentRepository;
import com.tailandtale.domain.community.repository.CommunityPostRepository;
import com.tailandtale.domain.community.repository.PostLikeRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.report.dto.ReportDto;
import com.tailandtale.domain.report.entity.Report;
import com.tailandtale.domain.report.entity.ReportProcessAction;
import com.tailandtale.domain.report.entity.ReportReason;
import com.tailandtale.domain.report.entity.ReportStatus;
import com.tailandtale.domain.report.entity.ReportTargetType;
import com.tailandtale.domain.report.repository.ReportRepository;
import com.tailandtale.global.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

// 신고 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private final ReportRepository reportRepository;
    private final MemberRepository memberRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final PostLikeRepository postLikeRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    // 신고 생성
    @Transactional
    public ReportDto.Response createReport(
            Long reporterMemberId,
            ReportDto.CreateRequest request
    ) {
        Member reporter = findMember(reporterMemberId);

        validateContent(request);
        validateDuplicateReport(reporterMemberId, request.getTargetType(), request.getTargetId());

        Member reportedMember = resolveReportedMember(reporterMemberId, request.getTargetType(), request.getTargetId());

        if (reportedMember != null && reporter.getId().equals(reportedMember.getId())) {
            throw new CustomException(ReportErrorCode.REPORT_SELF_DENIED);
        }

        Report report = Report.create(
                reporter,
                reportedMember,
                request.getTargetType(),
                request.getTargetId(),
                request.getReason(),
                normalizeContent(request.getContent())
        );

        return ReportDto.Response.from(reportRepository.save(report));
    }

    // 관리자 신고 목록 조회
    public ReportDto.PageResponse getReportsForAdmin(
            ReportStatus status,
            ReportTargetType targetType,
            Pageable pageable
    ) {
        Page<Report> reportPage = reportRepository.searchForAdmin(status, targetType, pageable);

        return ReportDto.PageResponse.builder()
                .reports(reportPage.getContent().stream()
                        .map(ReportDto.Response::from)
                        .toList())
                .page(reportPage.getNumber())
                .size(reportPage.getSize())
                .totalElements(reportPage.getTotalElements())
                .totalPages(reportPage.getTotalPages())
                .last(reportPage.isLast())
                .build();
    }

    // 관리자 신고 처리
    @Transactional
    public ReportDto.Response processReport(
            Long adminMemberId,
            Long reportId,
            ReportDto.ProcessRequest request
    ) {
        Member admin = findMember(adminMemberId);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new CustomException(ReportErrorCode.REPORT_NOT_FOUND));

        ReportProcessAction action = request.getAction() == null
                ? ReportProcessAction.REVIEW_ONLY
                : request.getAction();

        applyReportAction(report, action);

        report.process(
                admin,
                resolveReportStatus(action, request.getStatus()),
                normalizeContent(request.getAdminMemo())
        );

        return ReportDto.Response.from(report);
    }

    private void applyReportAction(
            Report report,
            ReportProcessAction action
    ) {
        switch (action) {
            case REVIEW_ONLY, REJECT_REPORT, RESOLVE_ONLY -> {
            }
            case DELETE_TARGET -> deleteReportedTarget(report);
            case BAN_REPORTED_MEMBER -> banReportedMember(report);
        }
    }

    private ReportStatus resolveReportStatus(
            ReportProcessAction action,
            ReportStatus requestStatus
    ) {
        return switch (action) {
            case REJECT_REPORT -> ReportStatus.REJECTED;
            case RESOLVE_ONLY, DELETE_TARGET, BAN_REPORTED_MEMBER -> ReportStatus.RESOLVED;
            case REVIEW_ONLY -> requestStatus;
        };
    }

    private void deleteReportedTarget(Report report) {
        switch (report.getTargetType()) {
            case COMMUNITY_POST -> {
                CommunityPost post = communityPostRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND));
                postLikeRepository.deleteAllByCommunityPostId(post.getId());
                communityCommentRepository.deleteAllByCommunityPostId(post.getId());
                communityPostRepository.delete(post);
            }
            case COMMUNITY_COMMENT -> {
                CommunityComment comment = communityCommentRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND));

                if (!Boolean.TRUE.equals(comment.getIsDeleted())) {
                    comment.delete();
                    comment.getCommunityPost().decreaseCommentCount();
                }
            }
            case CHAT_MESSAGE -> {
                ChatMessage chatMessage = chatMessageRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new CustomException(ReportErrorCode.REPORT_TARGET_NOT_FOUND));
                chatMessage.delete();
            }
            case MEMBER, CHAT_ROOM -> throw new CustomException(ReportErrorCode.REPORT_ACTION_NOT_SUPPORTED);
        }
    }

    private void banReportedMember(Report report) {
        Member reportedMember = report.getReportedMember();

        if (reportedMember == null) {
            throw new CustomException(ReportErrorCode.REPORT_ACTION_NOT_SUPPORTED);
        }

        reportedMember.ban();
    }

    public long countPendingReports() {
        return reportRepository.countByStatus(ReportStatus.PENDING);
    }

    private Member resolveReportedMember(
            Long reporterMemberId,
            ReportTargetType targetType,
            Long targetId
    ) {
        return switch (targetType) {
            case MEMBER -> findMember(targetId);
            case COMMUNITY_POST -> {
                CommunityPost post = communityPostRepository.findById(targetId)
                        .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_POST_NOT_FOUND));
                yield post.getMember();
            }
            case COMMUNITY_COMMENT -> {
                CommunityComment comment = communityCommentRepository.findById(targetId)
                        .orElseThrow(() -> new CustomException(CommunityErrorCode.COMMUNITY_COMMENT_NOT_FOUND));
                yield comment.getMember();
            }
            case CHAT_ROOM -> {
                ChatRoom chatRoom = chatRoomRepository.findById(targetId)
                        .orElseThrow(() -> new CustomException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));
                validateChatRoomMember(chatRoom.getId(), reporterMemberId);
                yield chatRoom.getWalkSchedule().getHostMember();
            }
            case CHAT_MESSAGE -> {
                ChatMessage chatMessage = chatMessageRepository.findById(targetId)
                        .orElseThrow(() -> new CustomException(ReportErrorCode.REPORT_TARGET_NOT_FOUND));
                validateChatRoomMember(chatMessage.getChatRoom().getId(), reporterMemberId);
                yield chatMessage.getSender();
            }
        };
    }

    private void validateChatRoomMember(
            Long chatRoomId,
            Long memberId
    ) {
        boolean exists = chatRoomMemberRepository.existsByChatRoomIdAndMemberIdAndStatus(
                chatRoomId,
                memberId,
                ChatRoomMemberStatus.ACTIVE
        );

        if (!exists) {
            throw new CustomException(ChatErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
    }

    private void validateDuplicateReport(
            Long reporterMemberId,
            ReportTargetType targetType,
            Long targetId
    ) {
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(reporterMemberId, targetType, targetId)) {
            throw new CustomException(ReportErrorCode.REPORT_DUPLICATED);
        }
    }

    private void validateContent(ReportDto.CreateRequest request) {
        if (request.getReason() == ReportReason.ETC && !StringUtils.hasText(request.getContent())) {
            throw new CustomException(ReportErrorCode.REPORT_CONTENT_REQUIRED);
        }
    }

    private String normalizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            return null;
        }

        return content.trim();
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }
}
