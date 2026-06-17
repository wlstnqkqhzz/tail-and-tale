package com.tailandtale.domain.notification.service;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.notification.dto.NotificationDto;
import com.tailandtale.domain.notification.entity.Notification;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationType;
import com.tailandtale.domain.notification.repository.NotificationRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.NotificationErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 알림 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 알림 생성
    @Transactional
    public void createNotification(
            Member member,
            NotificationType type,
            String title,
            String content,
            NotificationTargetType targetType,
            Long targetId
    ) {
        Notification notification = Notification.create(
                member,
                type,
                title,
                content,
                targetType,
                targetId
        );

        notificationRepository.save(notification);

        messagingTemplate.convertAndSend(
                "/sub/notifications/" + member.getId(),
                NotificationDto.Response.from(notification)
        );
    }

    // 내 알림 목록 조회
    public NotificationDto.ListResponse getMyNotifications(Long memberId) {
        return NotificationDto.ListResponse.builder()
                .unreadCount(notificationRepository.countByMemberIdAndIsReadFalse(memberId))
                .notifications(notificationRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                        .stream()
                        .map(NotificationDto.Response::from)
                        .toList())
                .build();
    }

    // 알림 읽음 처리
    @Transactional
    public NotificationDto.Response readNotification(Long memberId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndMemberId(notificationId, memberId)
                .orElseThrow(() -> new CustomException(NotificationErrorCode.NOTIFICATION_NOT_FOUND));

        notification.read();

        return NotificationDto.Response.from(notification);
    }

    // 전체 알림 읽음 처리
    @Transactional
    public void readAllNotifications(Long memberId) {
        notificationRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .forEach(Notification::read);
    }

    // 대상 알림 전체 읽음 처리
    @Transactional
    public void readTargetNotifications(
            Long memberId,
            NotificationTargetType targetType,
            Long targetId
    ) {
        notificationRepository.findAllByMemberIdAndTargetTypeAndTargetIdAndIsReadFalse(
                        memberId,
                        targetType,
                        targetId
                )
                .forEach(Notification::read);
    }
}
