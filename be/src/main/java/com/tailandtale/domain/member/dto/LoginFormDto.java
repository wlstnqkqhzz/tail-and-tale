package com.tailandtale.domain.member.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

        @JsonIgnore
        private String refreshToken;
    }

    // OAuth2 인증 코드 응답 DTO
    @Getter
    @Builder
    public static class OAuth2CodeResponse {
        private String code;
        private String status;
        private String provider;
    }

    // OAuth2 인증 코드 교환 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class OAuth2CodeExchangeRequest {
        @NotBlank(message = "OAuth2 인증 코드가 필수입니다.")
        private String code;
    }
}
