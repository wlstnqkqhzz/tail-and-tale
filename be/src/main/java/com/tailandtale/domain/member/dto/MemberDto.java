package com.tailandtale.domain.member.dto;

import com.tailandtale.domain.care.dto.AiAnalysisDto;
import com.tailandtale.domain.care.dto.EmotionDiaryDto;
import com.tailandtale.domain.care.dto.HealthRecordDto;
import com.tailandtale.domain.care.dto.WalkRecordDto;
import com.tailandtale.domain.chat.dto.ChatDto;
import com.tailandtale.domain.community.dto.CommunityCommentDto;
import com.tailandtale.domain.community.dto.CommunityPostDto;
import com.tailandtale.domain.dog.dto.DogDto;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.dto.WalkReviewDto;
import com.tailandtale.domain.walk.entity.WalkParticipant;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
        @Email(message = "올바른 이메일 형식으로 입력해주세요.")
        @Size(max = 100, message = "이메일은 100자 이하로 입력해주세요.")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하로 입력해주세요.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]{8,20}$",
                message = "비밀번호는 영문과 숫자를 포함해야 합니다."
        )
        private String password;

        @NotBlank(message = "실명은 필수입니다.")
        @Size(min = 2, max = 20, message = "실명은 2자 이상 20자 이하로 입력해주세요.")
        @Pattern(regexp = "^[가-힣a-zA-Z\\s]+$", message = "실명은 한글 또는 영문으로 입력해주세요.")
        private String realName;

        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 12, message = "닉네임은 2자 이상 12자 이하로 입력해주세요.")
        @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.")
        private String nickname;

        @NotBlank(message = "전화번호는 필수입니다.")
        @Pattern(regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$", message = "전화번호 형식이 올바르지 않습니다.")
        private String phoneNumber;

        @NotBlank(message = "거주 지역은 필수입니다.")
        @Size(min = 2, max = 30, message = "거주 지역은 2자 이상 30자 이하로 입력해주세요.")
        @Pattern(
                regexp = "^([가-힣]+(특별시|광역시|특별자치시|특별자치도|도)\\s[가-힣]+(시|군|구))$",
                message = "거주 지역은 시/도와 시/군/구를 모두 선택해주세요."
        )
        private String region;

        @NotBlank(message = "자기소개는 필수입니다.")
        @Size(min = 5, max = 200, message = "자기소개는 5자 이상 200자 이하로 입력해주세요.")
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
        @Pattern(
                regexp = "^$|^([가-힣]+(특별시|광역시|특별자치시|특별자치도|도)\\s[가-힣]+(시|군|구))$",
                message = "거주 지역은 시/도와 시/군/구를 모두 선택해주세요."
        )
        private String region;
        private String introduction;
    }

    // 비밀번호 확인 DTO
    @Getter
    @NoArgsConstructor
    public static class PasswordConfirmRequest {

        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
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
        private List<WalkReviewDto.Response> writtenReviews;
        private List<WalkReviewDto.Response> receivedReviews;
        private List<WalkRecordDto.Response> walkRecords;
        private List<EmotionDiaryDto.Response> emotionDiaries;
        private List<HealthRecordDto.Response> healthRecords;
        private List<AiAnalysisDto.Response> aiAnalyses;
        private List<CommunityPostDto.ListResponse> communityPosts;
        private List<CommunityCommentDto.Response> communityComments;
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
        @Pattern(
                regexp = "^$|^([가-힣]+(특별시|광역시|특별자치시|특별자치도|도)\\s[가-힣]+(시|군|구))$",
                message = "거주 지역은 시/도와 시/군/구를 모두 선택해주세요."
        )
        private String region;
        private String introduction;
    }
}
