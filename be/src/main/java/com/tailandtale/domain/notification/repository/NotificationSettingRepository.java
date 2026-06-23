package com.tailandtale.domain.notification.repository;

import com.tailandtale.domain.notification.entity.NotificationChannel;
import com.tailandtale.domain.notification.entity.NotificationSetting;
import com.tailandtale.domain.notification.entity.NotificationSettingType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 알림 설정 Repository

public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {

    // 내 알림 설정 목록 조회
    List<NotificationSetting> findAllByMemberIdAndChannel(Long memberId, NotificationChannel channel);

    // 내 알림 설정 조회
    Optional<NotificationSetting> findByMemberIdAndNotificationTypeAndChannel(
            Long memberId,
            NotificationSettingType notificationType,
            NotificationChannel channel
    );
}
