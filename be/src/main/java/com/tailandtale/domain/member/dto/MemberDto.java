package com.tailandtale.domain.member.dto;

import com.tailandtale.domain.care.dto.AiAnalysisDto;
import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.chat.dto.ChatDto;
import com.tailandtale.domain.dog.dto.DogDto;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.entity.WalkParticipant;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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

    // 마이페이지 대시보드 응답 DTO
    @Getter
    @Builder
    public static class DashboardResponse {

        private DetailResponse member;
        private List<DogDto.DetailResponse> dogs;
        private List<WalkScheduleDto.DetailResponse> myWalkSchedules;
        private List<ParticipationResponse> myParticipations;
        private List<ChatDto.RoomResponse> chatRooms;
        private List<EmotionDiaryDto.Response> emotionDiaries;
        private List<HealthRecordDto.Response> healthRecords;
        private List<AiAnalysisDto.Response> aiAnalyses;
    }

    // 내 산책 참여 응답 DTO
    @Getter
    @Builder
    public static class ParticipationResponse {

        private Long walkParticipantId;
        private Long walkScheduleId;
        private String title;
        private String meetingPlace;
        private LocalDateTime scheduledAt;
        private Integer maxParticipants;
        private Long currentParticipantCount;
        private WalkParticipantStatus status;
        private String dogName;

        public static ParticipationResponse from(WalkParticipant walkParticipant, long approvedParticipantCount) {
            return ParticipationResponse.builder()
                    .walkParticipantId(walkParticipant.getId())
                    .walkScheduleId(walkParticipant.getWalkSchedule().getId())
                    .title(walkParticipant.getWalkSchedule().getTitle())
                    .meetingPlace(walkParticipant.getWalkSchedule().getMeetingPlace())
                    .scheduledAt(walkParticipant.getWalkSchedule().getScheduledAt())
                    .maxParticipants(walkParticipant.getWalkSchedule().getMaxParticipants())
                    .currentParticipantCount(approvedParticipantCount + 1)
                    .status(walkParticipant.getStatus())
                    .dogName(walkParticipant.getDog().getName())
                    .build();
        }
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
