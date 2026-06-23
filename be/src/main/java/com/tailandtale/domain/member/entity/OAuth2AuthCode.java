package com.tailandtale.domain.member.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// OAuth2 인증 코드 Entity

@Entity
@Getter
@Table(name = "oauth2_auth_code")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OAuth2AuthCode extends BaseEntity {

    // =========================
    // 인증 코드 정보
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oauth2_auth_code_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    private String codeHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider provider;

    @Column(name = "redirect_uri", length = 500)
    private String redirectUri;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    // =========================
    // 생성 메서드
    // =========================

    // OAuth2 인증 코드 생성
    @Builder
    private OAuth2AuthCode(
            Member member,
            String codeHash,
            OAuthProvider provider,
            String redirectUri,
            String userAgent,
            String ipAddress,
            LocalDateTime expiresAt
    ) {
        this.member = member;
        this.codeHash = codeHash;
        this.provider = provider;
        this.redirectUri = redirectUri;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
        this.expiresAt = expiresAt;
    }

    // =========================
    // 인증 코드 상태 관리
    // =========================

    // 인증 코드 사용 가능 여부 확인
    public boolean isUsable(LocalDateTime now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    // 인증 코드 사용 처리
    public void use() {
        this.usedAt = LocalDateTime.now();
    }
}
