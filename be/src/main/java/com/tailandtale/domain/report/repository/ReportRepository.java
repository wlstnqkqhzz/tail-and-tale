package com.tailandtale.domain.report.repository;

import com.tailandtale.domain.report.entity.Report;
import com.tailandtale.domain.report.entity.ReportStatus;
import com.tailandtale.domain.report.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// 신고 Repository

public interface ReportRepository extends JpaRepository<Report, Long> {

    // 중복 신고 확인
    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId,
            ReportTargetType targetType,
            Long targetId
    );

    // 관리자 신고 목록 검색
    @Query("""
            select r
            from Report r
            where (:status is null or r.status = :status)
              and (:targetType is null or r.targetType = :targetType)
            """
    )
    Page<Report> searchForAdmin(
            @Param("status") ReportStatus status,
            @Param("targetType") ReportTargetType targetType,
            Pageable pageable
    );

    // 미처리 신고 수
    long countByStatus(ReportStatus status);
}
