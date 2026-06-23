package com.tailandtale.domain.notification.dto;

import com.tailandtale.domain.notification.entity.Notification;
import com.tailandtale.domain.notification.entity.NotificationChannel;
import com.tailandtale.domain.notification.entity.NotificationSetting;
import com.tailandtale.domain.notification.entity.NotificationSettingType;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// 알림 DTO

public class NotificationDto {

    // 알림 목록 응답 DTO
    @Getter
    @Builder
    public static class ListResponse {
        private Long unreadCount;
        private List<Response> notifications;
    }

    // 알림 설정 변경 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class SettingUpdateRequest {

        @NotNull(message = "알림 수신 여부는 필수입니다.")
        private Boolean isEnabled;
    }

    // 알림 설정 응답 DTO
    @Getter
    @Builder
    public static class SettingResponse {

        private NotificationSettingType notificationType;
        private NotificationChannel channel;
        private Boolean isEnabled;

        public static SettingResponse from(NotificationSetting notificationSetting) {
            return SettingResponse.builder()
                    .notificationType(notificationSetting.getNotificationType())
                    .channel(notificationSetting.getChannel())
                    .isEnabled(notificationSetting.getIsEnabled())
                    .build();
        }

        public static SettingResponse defaultEnabled(NotificationSettingType notificationType, NotificationChannel channel) {
            return SettingResponse.builder()
                    .notificationType(notificationType)
                    .channel(channel)
                    .isEnabled(true)
                    .build();
        }
    }

    // 알림 응답 DTO
    @Getter
    @Builder
    public static class Response {
        private Long notificationId;
        private NotificationType type;
        private String title;
        private String content;
        private NotificationTargetType targetType;
        private Long targetId;
        private Boolean isRead;
        private LocalDateTime readAt;
        private LocalDateTime createdAt;

        public static Response from(Notification notification) {
            return Response.builder()
                    .notificationId(notification.getId())
                    .type(notification.getType())
                    .title(notification.getTitle())
                    .content(notification.getContent())
                    .targetType(notification.getTargetType())
                    .targetId(notification.getTargetId())
                    .isRead(notification.getIsRead())
                    .readAt(notification.getReadAt())
                    .createdAt(notification.getCreatedAt())
                    .build();
        }
    }
}
