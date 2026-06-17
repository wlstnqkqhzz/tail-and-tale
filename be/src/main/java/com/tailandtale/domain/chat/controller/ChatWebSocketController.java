package com.tailandtale.domain.chat.controller;

import com.tailandtale.domain.chat.dto.ChatDto;
import com.tailandtale.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// 채팅 WebSocket 컨트롤러

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // 채팅 메시지 전송
    @MessageMapping("/chat/rooms/{chatRoomId}/messages")
    public void sendMessage(
            @DestinationVariable Long chatRoomId,
            @Valid ChatDto.SendMessageRequest request,
            Principal principal
    ) {
        Long memberId = Long.valueOf(principal.getName());

        ChatDto.MessageResponse response = chatService.sendMessage(
                memberId,
                chatRoomId,
                request
        );

        messagingTemplate.convertAndSend(
                "/sub/chat/rooms/" + chatRoomId,
                response
        );
    }
}
