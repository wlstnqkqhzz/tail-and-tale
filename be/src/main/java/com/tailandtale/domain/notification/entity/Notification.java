package com.tailandtale.domain.notification.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 알림 Entity

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity {

    // 알림 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    // 알림 수신 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 알림 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // 알림 제목
    @Column(nullable = false, length = 100)
    private String title;

    // 알림 내용
    @Column(nullable = false, length = 300)
    private String content;

    // 이동 대상 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private NotificationTargetType targetType;

    // 이동 대상 ID
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 읽음 여부
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    // 읽은 시간
    @Column(name = "read_at")
    private LocalDateTime readAt;

    // 알림 생성
    private Notification(
            Member member,
            NotificationType type,
            String title,
            String content,
            NotificationTargetType targetType,
            Long targetId
    ) {
        this.member = member;
        this.type = type;
        this.title = title;
        this.content = content;
        this.targetType = targetType;
        this.targetId = targetId;
        this.isRead = false;
    }

    // 알림 생성
    public static Notification create(
            Member member,
            NotificationType type,
            String title,
            String content,
            NotificationTargetType targetType,
            Long targetId
    ) {
        return new Notification(
                member,
                type,
                title,
                content,
                targetType,
                targetId
        );
    }

    // 알림 읽음 처리
    public void read() {
        if (Boolean.TRUE.equals(this.isRead)) {
            return;
        }

        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}
