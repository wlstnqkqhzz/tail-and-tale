package com.tailandtale.domain.care.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

// AI 분석 결과 Entity

@Entity
@Table(name = "ai_analysis_result")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiAnalysisResult {

    // AI 분석 결과 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ai_analysis_result_id")
    private Long id;

    // 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 분석 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false, length = 30)
    private AnalysisType analysisType;

    // 분석 시작일
    @Column(name = "target_start_date")
    private LocalDate targetStartDate;

    // 분석 종료일
    @Column(name = "target_end_date")
    private LocalDate targetEndDate;

    // 분석 요약
    @Column(nullable = false, length = 500)
    private String summary;

    // 분석 상세 내용
    @Column(name = "result_content", nullable = false, columnDefinition = "TEXT")
    private String resultContent;

    // 위험도
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    // 맞춤형 관리 가이드
    @Column(name = "guide_content", columnDefinition = "TEXT")
    private String guideContent;

    // 생성일
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // AI 분석 결과 생성
    private AiAnalysisResult(
            Dog dog,
            Member member,
            AnalysisType analysisType,
            LocalDate targetStartDate,
            LocalDate targetEndDate,
            String summary,
            String resultContent,
            RiskLevel riskLevel,
            String guideContent
    ) {
        this.dog = dog;
        this.member = member;
        this.analysisType = analysisType;
        this.targetStartDate = targetStartDate;
        this.targetEndDate = targetEndDate;
        this.summary = summary;
        this.resultContent = resultContent;
        this.riskLevel = riskLevel;
        this.guideContent = guideContent;
    }

    // AI 분석 결과 생성
    public static AiAnalysisResult create(
            Dog dog,
            Member member,
            AnalysisType analysisType,
            LocalDate targetStartDate,
            LocalDate targetEndDate,
            String summary,
            String resultContent,
            RiskLevel riskLevel,
            String guideContent
    ) {
        return new AiAnalysisResult(
                dog,
                member,
                analysisType,
                targetStartDate,
                targetEndDate,
                summary,
                resultContent,
                riskLevel,
                guideContent
        );
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
