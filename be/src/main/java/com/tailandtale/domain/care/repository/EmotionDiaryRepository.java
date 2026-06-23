package com.tailandtale.domain.care.repository;

import com.tailandtale.domain.care.entity.EmotionDiary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// 감정 다이어리 Repository

public interface EmotionDiaryRepository extends JpaRepository<EmotionDiary, Long> {
    // 내 감정 다이어리 목록 조회
    List<EmotionDiary> findAllByDog_Member_IdOrderByRecordedDateDesc(Long memberId);

    // 내 반려견 감정 다이어리 목록 조회
    List<EmotionDiary> findAllByDog_IdAndDog_Member_IdOrderByRecordedDateDesc(Long dogId, Long memberId);

    // 내 감정 다이어리 상세 조회
    Optional<EmotionDiary> findByIdAndDog_Member_Id(Long emotionDiaryId, Long memberId);

    // 감정 다이어리 중복 확인
    boolean existsByDog_IdAndRecordedDate(Long dogId, LocalDate recordedDate);

    // 감정 다이어리 중복 확인
    boolean existsByDog_IdAndRecordedDateAndIdNot(Long dogId, LocalDate recordedDate, Long emotionDiaryId);

    // 기간별 감정 다이어리 조회
    List<EmotionDiary> findAllByDog_IdAndDog_Member_IdAndRecordedDateBetweenOrderByRecordedDateAsc(
            Long dogId,
            Long memberId,
            LocalDate startDate,
            LocalDate endDate
    );

    // 최근 감정 다이어리 조회
    List<EmotionDiary> findTop5ByDog_Member_IdOrderByRecordedDateDesc(Long memberId);

    // 회원 감정 다이어리 수 조회
    long countByDog_Member_Id(Long memberId);
}
