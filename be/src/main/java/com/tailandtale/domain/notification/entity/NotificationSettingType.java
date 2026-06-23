package com.tailandtale.domain.notification.entity;

// 알림 설정 유형

public enum NotificationSettingType {
    ALL,
    WALK_REQUESTED,
    WALK_APPROVED,
    WALK_REJECTED,
    WALK_CANCELED,
    CHAT_MESSAGE;

    public static NotificationSettingType from(NotificationType type) {
        return NotificationSettingType.valueOf(type.name());
    }
}
