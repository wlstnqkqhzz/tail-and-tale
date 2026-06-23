package com.tailandtale.domain.report.dto;

import com.tailandtale.domain.report.entity.Report;
import com.tailandtale.domain.report.entity.ReportProcessAction;
import com.tailandtale.domain.report.entity.ReportReason;
import com.tailandtale.domain.report.entity.ReportStatus;
import com.tailandtale.domain.report.entity.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// 신고 DTO

public class ReportDto {

    // 신고 생성 요청
    @Getter
    @NoArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "신고 대상 타입을 선택해주세요.")
        private ReportTargetType targetType;

        @NotNull(message = "신고 대상을 선택해주세요.")
        private Long targetId;

        @NotNull(message = "신고 사유를 선택해주세요.")
        private ReportReason reason;

        @Size(max = 1000, message = "신고 상세 내용은 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 신고 처리 요청
    @Getter
    @NoArgsConstructor
    public static class ProcessRequest {
        @NotNull(message = "변경할 신고 상태를 선택해주세요.")
        private ReportStatus status;

        private ReportProcessAction action;

        @Size(max = 1000, message = "관리자 메모는 1000자 이하로 입력해주세요.")
        private String adminMemo;
    }

    // 신고 응답
    @Getter
    @Builder
    public static class Response {
        private Long reportId;
        private Long reporterMemberId;
        private String reporterNickname;
        private Long reportedMemberId;
        private String reportedNickname;
        private ReportTargetType targetType;
        private Long targetId;
        private ReportReason reason;
        private String content;
        private ReportStatus status;
        private Long adminMemberId;
        private String adminNickname;
        private String adminMemo;
        private LocalDateTime processedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Report report) {
            return Response.builder()
                    .reportId(report.getId())
                    .reporterMemberId(report.getReporter().getId())
                    .reporterNickname(report.getReporter().getNickname())
                    .reportedMemberId(report.getReportedMember() == null ? null : report.getReportedMember().getId())
                    .reportedNickname(report.getReportedMember() == null ? null : report.getReportedMember().getNickname())
                    .targetType(report.getTargetType())
                    .targetId(report.getTargetId())
                    .reason(report.getReason())
                    .content(report.getContent())
                    .status(report.getStatus())
                    .adminMemberId(report.getAdminMember() == null ? null : report.getAdminMember().getId())
                    .adminNickname(report.getAdminMember() == null ? null : report.getAdminMember().getNickname())
                    .adminMemo(report.getAdminMemo())
                    .processedAt(report.getProcessedAt())
                    .createdAt(report.getCreatedAt())
                    .updatedAt(report.getUpdatedAt())
                    .build();
        }
    }

    // 신고 목록 응답
    @Getter
    @Builder
    public static class PageResponse {
        private List<Response> reports;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
