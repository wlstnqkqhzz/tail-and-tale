package com.tailandtale.domain.member.dto;

import com.tailandtale.domain.member.entity.Member;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원 요청 및 응답 DTO 정의 클래스

public class MemberDto {

    // 회원가입 DTO
    @Getter
    @NoArgsConstructor
    public static class SignupRequest {

        @NotBlank(message = "이메일은 필수입니다.")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;

        @NotBlank(message = "실명은 필수입니다.")
        private String realName;

        @NotBlank(message = "닉네임은 필수입니다.")
        private String nickname;

        @NotBlank(message = "전화번호는 필수입니다.")
        private String phoneNumber;

        @NotBlank(message = "거주 지역은 필수입니다.")
        private String region;

        @NotBlank(message = "자기소개는 필수입니다.")
        private String introduction;
    }

    // 회원 정보 응답 DTO
    @Getter
    @Builder
    public static class DetailResponse {

        private Long memberId;
        private String email;
        private String realName;
        private String nickname;
        private String profileImageUrl;
        private String phoneNumber;
        private String region;
        private String introduction;
        private Boolean isRealNameVerified;
        private String role;
        private String status;

        public static DetailResponse from(Member member) {
            return DetailResponse.builder()
                    .memberId(member.getId())
                    .email(member.getEmail())
                    .realName(member.getRealName())
                    .nickname(member.getNickname())
                    .profileImageUrl(member.getProfileImageUrl())
                    .phoneNumber(member.getPhoneNumber())
                    .region(member.getRegion())
                    .introduction(member.getIntroduction())
                    .isRealNameVerified(member.getIsRealNameVerified())
                    .role(member.getRole().name())
                    .status(member.getStatus().name())
                    .build();
        }
    }

    // 회원 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {

        private String nickname;
        private String phoneNumber;
        private String region;
        private String introduction;
    }

    // OAuth 추가 정보 입력 DTO
    @Getter
    @NoArgsConstructor
    public static class CompleteProfileRequest {

        @NotBlank(message = "실명은 필수입니다.")
        private String realName;

        @NotBlank(message = "닉네임은 필수입니다.")
        private String nickname;

        private String phoneNumber;
        private String region;
        private String introduction;
    }
}
