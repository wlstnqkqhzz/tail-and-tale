package com.tailandtale.domain.chat.controller;

import com.tailandtale.domain.chat.dto.ChatDto;
import com.tailandtale.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 채팅 REST API 컨트롤러

@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    // 내 채팅방 목록 조회
    @GetMapping("/api/chat/rooms")
    public ResponseEntity<List<ChatDto.RoomResponse>> getMyChatRooms() {
        return ResponseEntity.ok(
                chatService.getMyChatRooms(
                        getLoginMemberId()
                )
        );
    }

    // 산책 일정 채팅방 조회
    @GetMapping("/api/walk-schedules/{walkScheduleId}/chat-room")
    public ResponseEntity<ChatDto.RoomResponse> getWalkChatRoom(@PathVariable Long walkScheduleId) {
        return ResponseEntity.ok(
                chatService.getWalkChatRoom(
                        getLoginMemberId(),
                        walkScheduleId
                )
        );
    }

    // 채팅 메시지 목록 조회
    @GetMapping("/api/chat/rooms/{chatRoomId}/messages")
    public ResponseEntity<ChatDto.MessageListResponse> getMessages(
            @PathVariable Long chatRoomId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(
                chatService.getMessages(
                        getLoginMemberId(),
                        chatRoomId,
                        cursor,
                        size
                )
        );
    }

    // 채팅방 읽음 처리
    @PatchMapping("/api/chat/rooms/{chatRoomId}/read")
    public ResponseEntity<Void> readMessages(@PathVariable Long chatRoomId, @RequestBody ChatDto.ReadRequest request) {
        chatService.readMessages(
                getLoginMemberId(),
                chatRoomId,
                request
        );

        return ResponseEntity.ok().build();
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
