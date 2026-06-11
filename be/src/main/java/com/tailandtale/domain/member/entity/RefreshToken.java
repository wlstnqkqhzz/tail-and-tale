package com.tailandtale.domain.member.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Refresh Token Entity

@Entity
@Getter
@Table(name = "refresh_token")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseEntity {

    // =========================
    // 토큰 정보
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refresh_token_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, unique = true, length = 500)
    private String token;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    // =========================
    // 생성 메서드
    // =========================

    // Refresh Token 생성
    @Builder
    private RefreshToken(
            Member member,
            String token,
            String deviceId,
            String userAgent,
            String ipAddress,
            LocalDateTime expiresAt
    ) {
        this.member = member;
        this.token = token;
        this.deviceId = deviceId;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
        this.expiresAt = expiresAt;
    }

    // =========================
    // 토큰 상태 관리
    // =========================

    // Refresh Token 폐기
    public void revoke() {
        this.revokedAt = LocalDateTime.now();
    }
}
