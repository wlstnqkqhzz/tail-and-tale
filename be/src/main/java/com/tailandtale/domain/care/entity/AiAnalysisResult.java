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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ai_analysis_result_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false, length = 30)
    private AnalysisType analysisType;

    @Column(name = "target_start_date")
    private LocalDate targetStartDate;

    @Column(name = "target_end_date")
    private LocalDate targetEndDate;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(name = "result_content", nullable = false, columnDefinition = "TEXT")
    private String resultContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Column(name = "guide_content", columnDefinition = "TEXT")
    private String guideContent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

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
