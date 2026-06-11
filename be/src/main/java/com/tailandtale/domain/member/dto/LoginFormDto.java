package com.tailandtale.domain.member.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 인증 요청/응답 DTO 정의 클래스

public class LoginFormDto {

    // 로그인 DTO
    @Getter
    @NoArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "이메일은 필수입니다.")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }

    // JWT 토큰 응답 DTO
    @Getter
    @Builder
    public static class TokenResponse {

        private String grantType;
        private String accessToken;
        private String refreshToken;
    }

    // Refresh Token 재발급 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class ReissueRequest {
        @NotBlank(message = "Refresh Token은 필수입니다.")
        private String refreshToken;
    }

    // 로그아웃 DTO
    @Getter
    @NoArgsConstructor
    public static class LogoutRequest {
        @NotBlank(message = "Refresh Token은 필수입니다.")
        private String refreshToken;
    }
}
