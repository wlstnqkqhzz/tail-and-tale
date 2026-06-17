package com.tailandtale.global.config;

import com.tailandtale.domain.chat.entity.ChatRoomMemberStatus;
import com.tailandtale.domain.chat.repository.ChatRoomMemberRepository;
import com.tailandtale.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// WebSocket STOMP 설정

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtProvider jwtProvider;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final Map<String, Long> sessionMemberIds = new ConcurrentHashMap<>();

    @Value("${app.frontend-url}")
    private String frontendBaseUrl;

    // STOMP 엔드포인트 설정
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns(
                        frontendBaseUrl,
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                );
    }

    // 메시지 브로커 설정
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub");
        registry.setApplicationDestinationPrefixes("/pub");
    }

    // WebSocket CONNECT JWT 인증
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

                try {
                    if (StompCommand.CONNECT == accessor.getCommand()) {
                        String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
                        String accessToken = extractAccessToken(authorizationHeader);

                        if (!jwtProvider.validateAccessToken(accessToken)) {
                            throw new IllegalArgumentException("WebSocket 인증에 실패했습니다.");
                        }

                        Long memberId = jwtProvider.getMemberIdFromAccessToken(accessToken);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        memberId,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                                );

                        accessor.setUser(authentication);
                        sessionMemberIds.put(accessor.getSessionId(), memberId);

                        return MessageBuilder.createMessage(
                                message.getPayload(),
                                accessor.getMessageHeaders()
                        );
                    }

                    if (StompCommand.SUBSCRIBE == accessor.getCommand()) {
                        setAuthenticationFromSession(accessor);
                        validateChatRoomSubscribe(accessor);
                        validateNotificationSubscribe(accessor);

                        return MessageBuilder.createMessage(
                                message.getPayload(),
                                accessor.getMessageHeaders()
                        );
                    }

                    if (StompCommand.SEND == accessor.getCommand()) {
                        setAuthenticationFromSession(accessor);

                        if (accessor.getUser() == null) {
                            throw new IllegalArgumentException("WebSocket 인증 정보가 없습니다.");
                        }

                        return MessageBuilder.createMessage(
                                message.getPayload(),
                                accessor.getMessageHeaders()
                        );
                    }

                    if (StompCommand.DISCONNECT == accessor.getCommand()) {
                        sessionMemberIds.remove(accessor.getSessionId());
                    }

                    return message;
                } catch (RuntimeException exception) {
                    log.warn(
                            "Chat WebSocket frame failed. command={}, destination={}, sessionId={}, message={}",
                            accessor.getCommand(),
                            accessor.getDestination(),
                            accessor.getSessionId(),
                            exception.getMessage()
                    );
                    throw exception;
                }
            }
        });
    }

    // 알림 구독 권한 검증
    private void validateNotificationSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();

        if (destination == null || !destination.startsWith("/sub/notifications/")) {
            return;
        }

        Long memberId = resolveMemberId(accessor);

        if (memberId == null) {
            throw new IllegalArgumentException("WebSocket 인증 정보가 없습니다.");
        }

        Long destinationMemberId = Long.valueOf(destination.replace("/sub/notifications/", ""));

        if (!memberId.equals(destinationMemberId)) {
            throw new IllegalArgumentException("알림 구독 권한이 없습니다.");
        }
    }

    // 채팅방 구독 권한 검증
    private void validateChatRoomSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();

        if (destination == null || !destination.startsWith("/sub/chat/rooms/")) {
            return;
        }

        Long memberId = resolveMemberId(accessor);

        if (memberId == null) {
            throw new IllegalArgumentException("WebSocket 인증 정보가 없습니다.");
        }

        Long chatRoomId = Long.valueOf(destination.replace("/sub/chat/rooms/", ""));
        boolean activeMember = chatRoomMemberRepository.existsByChatRoomIdAndMemberIdAndStatus(
                chatRoomId,
                memberId,
                ChatRoomMemberStatus.ACTIVE
        );

        if (!activeMember) {
            throw new IllegalArgumentException("채팅방 구독 권한이 없습니다.");
        }
    }

    // WebSocket 세션에서 회원 ID 조회
    private Long resolveMemberId(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return Long.valueOf(accessor.getUser().getName());
        }

        return sessionMemberIds.get(accessor.getSessionId());
    }

    // WebSocket 세션 인증 정보 설정
    private void setAuthenticationFromSession(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }

        Long memberId = sessionMemberIds.get(accessor.getSessionId());

        if (memberId == null) {
            return;
        }

        accessor.setUser(
                new UsernamePasswordAuthenticationToken(
                        memberId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );
    }

    // Authorization 헤더에서 Access Token 추출
    private String extractAccessToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("WebSocket 인증 토큰이 없습니다.");
        }

        return authorizationHeader.substring(7);
    }
}
