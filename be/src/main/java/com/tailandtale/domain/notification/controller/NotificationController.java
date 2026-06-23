package com.tailandtale.domain.notification.controller;

import com.tailandtale.domain.notification.dto.NotificationDto;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationSettingType;
import com.tailandtale.domain.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 알림 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    // 내 알림 목록 조회
    @GetMapping
    public ResponseEntity<NotificationDto.ListResponse> getMyNotifications() {
        return ResponseEntity.ok(
                notificationService.getMyNotifications(
                        getLoginMemberId()
                )
        );
    }

    // 내 알림 설정 목록 조회
    @GetMapping("/settings")
    public ResponseEntity<List<NotificationDto.SettingResponse>> getMySettings() {
        return ResponseEntity.ok(
                notificationService.getMySettings(
                        getLoginMemberId()
                )
        );
    }

    // 내 알림 설정 변경
    @PatchMapping("/settings/{notificationType}")
    public ResponseEntity<NotificationDto.SettingResponse> updateMySetting(
            @PathVariable NotificationSettingType notificationType,
            @Valid @RequestBody NotificationDto.SettingUpdateRequest request
    ) {
        return ResponseEntity.ok(
                notificationService.updateMySetting(
                        getLoginMemberId(),
                        notificationType,
                        request
                )
        );
    }

    // 알림 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDto.Response> readNotification(@PathVariable Long notificationId) {
        return ResponseEntity.ok(
                notificationService.readNotification(
                        getLoginMemberId(),
                        notificationId
                )
        );
    }

    // 전체 알림 읽음 처리
    @PatchMapping("/read-all")
    public ResponseEntity<Void> readAllNotifications() {
        notificationService.readAllNotifications(
                getLoginMemberId()
        );

        return ResponseEntity.ok().build();
    }

    // 대상 알림 전체 읽음 처리
    @PatchMapping("/targets/{targetType}/{targetId}/read")
    public ResponseEntity<Void> readTargetNotifications(
            @PathVariable NotificationTargetType targetType,
            @PathVariable Long targetId
    ) {
        notificationService.readTargetNotifications(
                getLoginMemberId(),
                targetType,
                targetId
        );

        return ResponseEntity.ok().build();
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
