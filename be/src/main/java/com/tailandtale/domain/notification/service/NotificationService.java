package com.tailandtale.domain.notification.service;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.notification.dto.NotificationDto;
import com.tailandtale.domain.notification.entity.*;
import com.tailandtale.domain.notification.repository.NotificationRepository;
import com.tailandtale.domain.notification.repository.NotificationSettingRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import com.tailandtale.global.exception.NotificationErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// 알림 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final MemberRepository memberRepository;
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
        if (!isEnabled(member.getId(), type)) {
            return;
        }

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

    // 내 알림 설정 목록 조회
    public List<NotificationDto.SettingResponse> getMySettings(Long memberId) {
        Map<NotificationSettingType, NotificationSetting> settings = notificationSettingRepository.findAllByMemberIdAndChannel(
                        memberId,
                        NotificationChannel.WEB
                )
                .stream()
                .collect(Collectors.toMap(
                        NotificationSetting::getNotificationType,
                        Function.identity(),
                        (currentSetting, nextSetting) -> currentSetting
                ));

        return Arrays.stream(NotificationSettingType.values())
                .map(notificationType -> {
                    NotificationSetting setting = settings.get(notificationType);

                    return setting == null
                            ? NotificationDto.SettingResponse.defaultEnabled(notificationType, NotificationChannel.WEB)
                            : NotificationDto.SettingResponse.from(setting);
                })
                .toList();
    }

    // 내 알림 설정 변경
    @Transactional
    public NotificationDto.SettingResponse updateMySetting(
            Long memberId,
            NotificationSettingType notificationType,
            NotificationDto.SettingUpdateRequest request
    ) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        // 전체 알림은 모든 개별 알림을 한 번에 변경
        if (notificationType == NotificationSettingType.ALL) {
            NotificationSetting allSetting = null;

            for (NotificationSettingType settingType : NotificationSettingType.values()) {
                NotificationSetting savedSetting = saveNotificationSetting(
                        member,
                        settingType,
                        request.getIsEnabled()
                );

                if (settingType == NotificationSettingType.ALL) {
                    allSetting = savedSetting;
                }
            }

            return NotificationDto.SettingResponse.from(allSetting);
        }

        NotificationSetting notificationSetting = saveNotificationSetting(
                member,
                notificationType,
                request.getIsEnabled()
        );

        // 개별 알림을 다시 켜는 경우 전체 알림도 함께 활성화
        if (Boolean.TRUE.equals(request.getIsEnabled())) {
            saveNotificationSetting(member, NotificationSettingType.ALL, true);
        }

        return NotificationDto.SettingResponse.from(notificationSetting);
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

    // 알림 수신 가능 여부 확인
    private boolean isEnabled(Long memberId, NotificationType type) {
        boolean allEnabled = notificationSettingRepository.findByMemberIdAndNotificationTypeAndChannel(
                        memberId,
                        NotificationSettingType.ALL,
                        NotificationChannel.WEB
                )
                .map(NotificationSetting::getIsEnabled)
                .orElse(true);

        if (!allEnabled) {
            return false;
        }

        return notificationSettingRepository.findByMemberIdAndNotificationTypeAndChannel(
                        memberId,
                        NotificationSettingType.from(type),
                        NotificationChannel.WEB
                )
                .map(NotificationSetting::getIsEnabled)
                .orElse(true);
    }

    // 알림 설정 저장
    private NotificationSetting saveNotificationSetting(
            Member member,
            NotificationSettingType notificationType,
            Boolean isEnabled
    ) {
        NotificationSetting notificationSetting = notificationSettingRepository.findByMemberIdAndNotificationTypeAndChannel(
                member.getId(),
                notificationType,
                NotificationChannel.WEB
        ).orElseGet(() -> NotificationSetting.create(
                member,
                notificationType,
                NotificationChannel.WEB,
                true
        ));

        notificationSetting.updateEnabled(isEnabled);

        return notificationSettingRepository.save(notificationSetting);
    }
}
