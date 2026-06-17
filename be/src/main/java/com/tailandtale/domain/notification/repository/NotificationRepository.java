package com.tailandtale.domain.notification.repository;

import com.tailandtale.domain.notification.entity.Notification;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 알림 Repository

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 내 알림 목록 조회
    List<Notification> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 내 알림 조회
    Optional<Notification> findByIdAndMemberId(Long notificationId, Long memberId);

    // 내 대상 알림 목록 조회
    List<Notification> findAllByMemberIdAndTargetTypeAndTargetIdAndIsReadFalse(
            Long memberId,
            NotificationTargetType targetType,
            Long targetId
    );

    // 미읽음 알림 수 조회
    long countByMemberIdAndIsReadFalse(Long memberId);
}
