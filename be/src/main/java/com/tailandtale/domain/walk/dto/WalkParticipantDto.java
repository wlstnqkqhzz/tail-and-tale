package com.tailandtale.domain.walk.dto;

import com.tailandtale.domain.walk.entity.WalkParticipant;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 산책 참여 DTO

public class WalkParticipantDto {

    // 산책 참여 신청 DTO
    @Getter
    @NoArgsConstructor
    public static class Request {

        @NotNull(message = "참여 반려견 ID는 필수입니다.")
        private Long dogId;

        @Size(max = 300, message = "참여 신청 메시지는 300자 이하로 입력해주세요.")
        private String message;
    }

    // 산책 참여 정보 응답 DTO
    @Getter
    @Builder
    public static class Response {

        private Long walkParticipantId;
        private Long walkScheduleId;
        private Long memberId;
        private Long dogId;
        private String dogName;
        private String nickname;
        private String profileImageUrl;
        private WalkParticipantStatus status;
        private String message;

        public static Response from(WalkParticipant walkParticipant) {
            return Response.builder()
                    .walkParticipantId(walkParticipant.getId())
                    .walkScheduleId(walkParticipant.getWalkSchedule().getId())
                    .memberId(walkParticipant.getMember().getId())
                    .dogId(walkParticipant.getDog().getId())
                    .dogName(walkParticipant.getDog().getName())
                    .nickname(walkParticipant.getMember().getNickname())
                    .profileImageUrl(walkParticipant.getMember().getProfileImageUrl())
                    .status(walkParticipant.getStatus())
                    .message(walkParticipant.getMessage())
                    .build();
        }
    }
}
