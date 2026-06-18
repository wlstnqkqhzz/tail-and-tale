package com.tailandtale.domain.care.repository;

import com.tailandtale.domain.care.entity.WalkRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// 산책 기록 Repository

public interface WalkRecordRepository extends JpaRepository<WalkRecord, Long> {
    // 내 산책 기록 목록 조회
    List<WalkRecord> findAllByMember_IdOrderByStartedAtDesc(Long memberId);

    // 내 반려견 산책 기록 목록 조회
    List<WalkRecord> findAllByDog_IdAndMember_IdOrderByStartedAtDesc(Long dogId, Long memberId);

    // 내 산책 기록 상세 조회
    Optional<WalkRecord> findByIdAndMember_Id(Long walkRecordId, Long memberId);

    // 내 반려견 산책 기록 상세 조회
    Optional<WalkRecord> findByIdAndDog_IdAndMember_Id(Long walkRecordId, Long dogId, Long memberId);

    // 기간별 산책 기록 조회
    List<WalkRecord> findAllByDog_IdAndMember_IdAndStartedAtBetweenOrderByStartedAtAsc(
            Long dogId,
            Long memberId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    );

    // 최근 산책 기록 조회
    List<WalkRecord> findTop5ByMember_IdOrderByStartedAtDesc(Long memberId);
}
