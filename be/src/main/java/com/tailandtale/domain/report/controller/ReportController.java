package com.tailandtale.domain.report.controller;

import com.tailandtale.domain.report.dto.ReportDto;
import com.tailandtale.domain.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// 신고 API controller

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportDto.Response> createReport(
            @RequestBody @Valid ReportDto.CreateRequest request
    ) {
        return ResponseEntity.ok(
                reportService.createReport(
                        getLoginMemberId(),
                        request
                )
        );
    }

    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
