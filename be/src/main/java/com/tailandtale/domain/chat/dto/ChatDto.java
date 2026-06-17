package com.tailandtale.domain.chat.dto;

import com.tailandtale.domain.chat.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 채팅 DTO

public class ChatDto {

    // 채팅방 응답 DTO
    @Getter
    @Builder
    public static class RoomResponse {
        private Long chatRoomId;
        private Long walkScheduleId;
        private String walkTitle;
        private ChatRoomStatus status;
        private ChatRoomMemberRole myRole;
        private Long lastReadMessageId;
        private MessageResponse lastMessage;

        public static RoomResponse from(ChatRoomMember chatRoomMember, ChatMessage lastMessage) {
            ChatRoom chatRoom = chatRoomMember.getChatRoom();

            return RoomResponse.builder()
                    .chatRoomId(chatRoom.getId())
                    .walkScheduleId(chatRoom.getWalkSchedule().getId())
                    .walkTitle(chatRoom.getWalkSchedule().getTitle())
                    .status(chatRoom.getStatus())
                    .myRole(chatRoomMember.getRole())
                    .lastReadMessageId(chatRoomMember.getLastReadMessageId())
                    .lastMessage(lastMessage == null ? null : MessageResponse.from(lastMessage))
                    .build();
        }
    }

    // 메시지 전송 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class SendMessageRequest {
        @NotBlank(message = "채팅 메시지를 입력해주세요.")
        @Size(max = 1000, message = "채팅 메시지는 1000자 이하로 입력해주세요.")
        private String content;
    }

    // 읽음 처리 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class ReadRequest {
        private Long lastReadMessageId;
    }

    // 메시지 응답 DTO
    @Getter
    @Builder
    public static class MessageResponse {
        private Long chatMessageId;
        private Long chatRoomId;
        private Long senderId;
        private String senderNickname;
        private ChatMessageType messageType;
        private String content;
        private Boolean isDeleted;
        private LocalDateTime createdAt;

        public static MessageResponse from(ChatMessage chatMessage) {
            return MessageResponse.builder()
                    .chatMessageId(chatMessage.getId())
                    .chatRoomId(chatMessage.getChatRoom().getId())
                    .senderId(chatMessage.getSender() == null ? null : chatMessage.getSender().getId())
                    .senderNickname(chatMessage.getSender() == null ? null : chatMessage.getSender().getNickname())
                    .messageType(chatMessage.getMessageType())
                    .content(chatMessage.getContent())
                    .isDeleted(chatMessage.getIsDeleted())
                    .createdAt(chatMessage.getCreatedAt())
                    .build();
        }
    }
}
