package com.tailandtale.global.config;

// Spring Security 접근 권한 경로 관리

public final class SecurityPath {
    private SecurityPath() {}

    // 비인증 허용 경로
    public static final String[] PUBLIC_API = {
            "/api/members/signup",
            "/api/members/login",
            "/api/members/check-email",
            "/api/members/check-nickname",
            "/api/members/reissue",
            "/api/members/logout"
    };
}
