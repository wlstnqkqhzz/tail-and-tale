package com.tailandtale.domain.notification.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 알림 설정 Entity

@Entity
@Table(
        name = "notification_setting",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_notification_setting", columnNames = {"member_id", "notification_type", "channel"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationSetting extends BaseEntity {

    // 알림 설정 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_setting_id")
    private Long id;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 알림 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 30)
    private NotificationSettingType notificationType;

    // 알림 채널
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    // 수신 여부
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled;

    // 알림 설정 생성
    private NotificationSetting(
            Member member,
            NotificationSettingType notificationType,
            NotificationChannel channel,
            Boolean isEnabled
    ) {
        this.member = member;
        this.notificationType = notificationType;
        this.channel = channel;
        this.isEnabled = isEnabled == null || isEnabled;
    }

    // 알림 설정 생성
    public static NotificationSetting create(
            Member member,
            NotificationSettingType notificationType,
            NotificationChannel channel,
            Boolean isEnabled
    ) {
        return new NotificationSetting(
                member,
                notificationType,
                channel,
                isEnabled
        );
    }

    // 알림 수신 여부 변경
    public void updateEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled;
    }
}
