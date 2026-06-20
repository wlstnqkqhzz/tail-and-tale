package com.tailandtale.domain.care.repository;

import com.tailandtale.domain.care.entity.AiAnalysisResult;
import com.tailandtale.domain.care.entity.AnalysisType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// AI 분석 결과 Repository

public interface AiAnalysisResultRepository extends JpaRepository<AiAnalysisResult, Long> {

    // 내 AI 분석 결과 목록 조회
    List<AiAnalysisResult> findAllByMember_IdOrderByCreatedAtDesc(Long memberId);

    // 내 반려견 AI 분석 결과 목록 조회
    List<AiAnalysisResult> findAllByDog_IdAndMember_IdOrderByCreatedAtDesc(Long dogId, Long memberId);

    // 내 AI 분석 결과 상세 조회
    Optional<AiAnalysisResult> findByIdAndMember_Id(Long aiAnalysisResultId, Long memberId);

    // 최근 AI 분석 결과 조회
    List<AiAnalysisResult> findTop5ByMember_IdOrderByCreatedAtDesc(Long memberId);

    // 같은 기간의 기존 분석 결과 삭제
    void deleteAllByDog_IdAndMember_IdAndAnalysisTypeAndTargetStartDateAndTargetEndDate(
            Long dogId,
            Long memberId,
            AnalysisType analysisType,
            LocalDate targetStartDate,
            LocalDate targetEndDate
    );
}
