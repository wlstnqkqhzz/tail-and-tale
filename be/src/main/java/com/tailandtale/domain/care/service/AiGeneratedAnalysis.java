package com.tailandtale.domain.care.service;

import com.tailandtale.domain.care.entity.RiskLevel;

// AI 분석 생성 결과

public record AiGeneratedAnalysis(
        String summary,
        String resultContent,
        RiskLevel riskLevel,
        String guideContent
) {
}
