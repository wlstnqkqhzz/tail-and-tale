package com.tailandtale.domain.member.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 회원 Entity

@Entity
@Getter
@Table(name = "member")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    // =========================
    // 회원 기본 정보
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(name = "real_name", length = 50)
    private String realName;

    @Column(unique = true, length = 30)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // =========================
    // 회원 추가 정보
    // =========================

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String region;

    @Column(length = 300)
    private String introduction;

    // =========================
    // 실명 인증 정보
    // =========================

    @Column(name = "is_real_name_verified", nullable = false)
    private Boolean isRealNameVerified = false;

    @Column(name = "real_name_verified_at")
    private LocalDateTime realNameVerifiedAt;

    // =========================
    // 회원 권한 및 상태
    // =========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberStatus status = MemberStatus.ACTIVE;

    // =========================
    // 생성 메서드
    // =========================

    // 회원 생성
    @Builder
    private Member(
            String email,
            String password,
            String realName,
            String nickname,
            String profileImageUrl,
            String phoneNumber,
            String region,
            String introduction,
            MemberStatus status
    ) {
        this.email = email;
        this.password = password;
        this.realName = realName;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.phoneNumber = phoneNumber;
        this.region = region;
        this.introduction = introduction;
        this.isRealNameVerified = false;
        this.role = MemberRole.USER;
        this.status = status != null ? status : MemberStatus.ACTIVE;
    }

    // =========================
    // 회원 정보 수정
    // =========================

    // 회원 정보 수정
    public void updateProfile(
            String nickname,
            String phoneNumber,
            String region,
            String introduction
    ) {
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.region = region;
        this.introduction = introduction;
    }

    // OAuth 추가 정보 입력 완료
    public void completeProfile(
            String realName,
            String nickname,
            String phoneNumber,
            String region,
            String introduction
    ) {
        this.realName = realName;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.region = region;
        this.introduction = introduction;
        this.status = MemberStatus.ACTIVE;
    }

    // =========================
    // 회원 상태 관리
    // =========================

    // 실명 인증 처리
    public void verifyRealName() {
        this.isRealNameVerified = true;
        this.realNameVerifiedAt = LocalDateTime.now();
    }

    // 회원 정지 처리
    public void ban() {
        this.status = MemberStatus.BANNED;
    }

    // 회원 활성화 처리
    public void activate() {
        this.status = MemberStatus.ACTIVE;
    }

    // 회원 비활성화 처리
    public void deactivate() {
        this.status = MemberStatus.INACTIVE;
    }

    // 관리자 회원 상태 변경
    public void changeStatus(MemberStatus status) {
        this.status = status;
    }
}
