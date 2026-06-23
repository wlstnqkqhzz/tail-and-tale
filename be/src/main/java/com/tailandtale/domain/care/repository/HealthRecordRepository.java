package com.tailandtale.domain.care.repository;

import com.tailandtale.domain.care.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// 건강 기록 Repository

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    // 내 건강 기록 목록 조회
    List<HealthRecord> findAllByDog_Member_IdOrderByRecordedDateDesc(Long memberId);

    // 내 반려견 건강 기록 목록 조회
    List<HealthRecord> findAllByDog_IdAndDog_Member_IdOrderByRecordedDateDesc(Long dogId, Long memberId);

    // 내 건강 기록 상세 조회
    Optional<HealthRecord> findByIdAndDog_Member_Id(Long healthRecordId, Long memberId);

    // 건강 기록 중복 확인
    boolean existsByDog_IdAndRecordedDate(Long dogId, LocalDate recordedDate);

    // 건강 기록 중복 확인
    boolean existsByDog_IdAndRecordedDateAndIdNot(Long dogId, LocalDate recordedDate, Long healthRecordId);

    // 기간별 건강 기록 조회
    List<HealthRecord> findAllByDog_IdAndDog_Member_IdAndRecordedDateBetweenOrderByRecordedDateAsc(
            Long dogId,
            Long memberId,
            LocalDate startDate,
            LocalDate endDate
    );

    // 최근 건강 기록 조회
    List<HealthRecord> findTop5ByDog_Member_IdOrderByRecordedDateDesc(Long memberId);

    // 회원 건강 기록 수 조회
    long countByDog_Member_Id(Long memberId);
}
