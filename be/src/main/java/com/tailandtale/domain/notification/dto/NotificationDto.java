package com.tailandtale.domain.notification.dto;

import com.tailandtale.domain.notification.entity.Notification;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

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
