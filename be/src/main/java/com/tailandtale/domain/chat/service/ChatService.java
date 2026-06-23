package com.tailandtale.domain.chat.service;

import com.tailandtale.domain.chat.dto.ChatDto;
import com.tailandtale.domain.chat.entity.*;
import com.tailandtale.domain.chat.repository.ChatMessageRepository;
import com.tailandtale.domain.chat.repository.ChatRoomMemberRepository;
import com.tailandtale.domain.chat.repository.ChatRoomRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.service.MemberBlockService;
import com.tailandtale.domain.notification.entity.NotificationTargetType;
import com.tailandtale.domain.notification.entity.NotificationType;
import com.tailandtale.domain.notification.service.NotificationService;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// 산책 채팅 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {
    private static final int DEFAULT_MESSAGE_SIZE = 30;
    private static final int MAX_MESSAGE_SIZE = 100;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private final MemberBlockService memberBlockService;

    // 산책 생성 시 채팅방 생성
    @Transactional
    public ChatRoom createChatRoom(WalkSchedule walkSchedule) {
        ChatRoom chatRoom = chatRoomRepository.findByWalkScheduleId(walkSchedule.getId())
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.create(walkSchedule)));

        addOrActivateMember(
                chatRoom,
                walkSchedule.getHostMember(),
                ChatRoomMemberRole.HOST
        );

        return chatRoom;
    }

    // 산책 참여 승인 시 채팅방 입장
    @Transactional
    public void addParticipant(WalkSchedule walkSchedule, Member member) {
        ChatRoom chatRoom = createChatRoom(walkSchedule);

        addOrActivateMember(
                chatRoom,
                member,
                ChatRoomMemberRole.PARTICIPANT
        );
    }

    // 산책 참여 취소 시 채팅방 퇴장
    @Transactional
    public void leaveParticipant(Long walkScheduleId, Long memberId) {
        chatRoomRepository.findByWalkScheduleId(walkScheduleId)
                .flatMap(chatRoom -> chatRoomMemberRepository.findByChatRoomIdAndMemberId(
                        chatRoom.getId(),
                        memberId
                ))
                .ifPresent(ChatRoomMember::leave);
    }

    // 산책 취소 시 채팅방 닫기
    @Transactional
    public void closeChatRoom(Long walkScheduleId) {
        chatRoomRepository.findByWalkScheduleId(walkScheduleId)
                .ifPresent(ChatRoom::close);
    }

    // 내 채팅방 목록 조회
    public List<ChatDto.RoomResponse> getMyChatRooms(Long memberId) {
        return chatRoomMemberRepository.findAllByMemberIdAndStatusOrderByCreatedAtDesc(
                        memberId,
                        ChatRoomMemberStatus.ACTIVE
                )
                .stream()
                .map(chatRoomMember -> ChatDto.RoomResponse.from(
                        chatRoomMember,
                        getLastMessage(chatRoomMember.getChatRoom().getId())
                ))
                .toList();
    }

    // 산책 일정 채팅방 조회
    @Transactional
    public ChatDto.RoomResponse getWalkChatRoom(Long memberId, Long walkScheduleId) {
        WalkSchedule walkSchedule = getWalkSchedule(walkScheduleId);
        ChatRoom chatRoom = createChatRoom(walkSchedule);

        syncAuthorizedMember(chatRoom, walkSchedule, memberId);

        ChatRoomMember chatRoomMember = getActiveChatRoomMember(chatRoom.getId(), memberId);

        return ChatDto.RoomResponse.from(
                chatRoomMember,
                getLastMessage(chatRoom.getId())
        );
    }

    // 메시지 목록 조회
    public ChatDto.MessageListResponse getMessages(
            Long memberId,
            Long chatRoomId,
            Long cursor,
            Integer size
    ) {
        ChatRoomMember chatRoomMember = getActiveChatRoomMember(chatRoomId, memberId);

        int pageSize = getPageSize(size);
        List<ChatMessage> messages = cursor == null
                ? chatMessageRepository.findAllByChatRoomIdOrderByIdDesc(chatRoomId, PageRequest.of(0, pageSize))
                : chatMessageRepository.findAllByChatRoomIdAndIdLessThanOrderByIdDesc(chatRoomId, cursor, PageRequest.of(0, pageSize));

        List<ChatMessage> orderedMessages = new ArrayList<>(messages);
        Collections.reverse(orderedMessages);

        return ChatDto.MessageListResponse.builder()
                .lastReadMessageId(chatRoomMember.getLastReadMessageId())
                .messages(orderedMessages.stream()
                        .map(ChatDto.MessageResponse::from)
                        .toList())
                .build();
    }

    // 메시지 전송
    @Transactional
    public ChatDto.MessageResponse sendMessage(
            Long memberId,
            Long chatRoomId,
            ChatDto.SendMessageRequest request
    ) {
        ChatRoom chatRoom = getChatRoom(chatRoomId);
        Member member = getMember(memberId);

        validateChatRoomActive(chatRoom);
        validateActiveChatRoomMember(chatRoomId, memberId);
        validateNotBlockedChatMember(chatRoomId, memberId);
        validateMessage(request.getContent());

        ChatMessage chatMessage = ChatMessage.text(
                chatRoom,
                member,
                request.getContent().trim()
        );

        ChatMessage savedChatMessage = chatMessageRepository.save(chatMessage);
        createChatMessageNotifications(chatRoom, member, savedChatMessage);

        return ChatDto.MessageResponse.from(savedChatMessage);
    }

    // 읽음 처리
    @Transactional
    public void readMessages(
            Long memberId,
            Long chatRoomId,
            ChatDto.ReadRequest request
    ) {
        ChatRoomMember chatRoomMember = getActiveChatRoomMember(chatRoomId, memberId);
        ChatMessage lastMessage = getLastMessage(chatRoomId);
        Long lastReadMessageId = request.getLastReadMessageId();

        if (lastReadMessageId == null && lastMessage != null) {
            lastReadMessageId = lastMessage.getId();
        }

        chatRoomMember.read(lastReadMessageId);
    }

    // 채팅방 참여자 추가 또는 활성화
    private void addOrActivateMember(
            ChatRoom chatRoom,
            Member member,
            ChatRoomMemberRole role
    ) {
        ChatRoomMember chatRoomMember = chatRoomMemberRepository.findByChatRoomIdAndMemberId(
                chatRoom.getId(),
                member.getId()
        ).map(existingMember -> {
            existingMember.activate(role);
            return existingMember;
        }).orElseGet(() -> ChatRoomMember.create(
                chatRoom,
                member,
                role
        ));

        chatRoomMemberRepository.save(chatRoomMember);
    }

    // 기존 데이터용 채팅방 멤버 보정
    private void syncAuthorizedMember(
            ChatRoom chatRoom,
            WalkSchedule walkSchedule,
            Long memberId
    ) {
        if (walkSchedule.getHostMember().getId().equals(memberId)) {
            addOrActivateMember(
                    chatRoom,
                    walkSchedule.getHostMember(),
                    ChatRoomMemberRole.HOST
            );
            return;
        }

        boolean approvedParticipant = walkParticipantRepository.existsByWalkScheduleIdAndMemberIdAndStatus(
                walkSchedule.getId(),
                memberId,
                WalkParticipantStatus.APPROVED
        );

        if (approvedParticipant) {
            addOrActivateMember(
                    chatRoom,
                    getMember(memberId),
                    ChatRoomMemberRole.PARTICIPANT
            );
        }
    }

    // 채팅방 조회
    private ChatRoom getChatRoom(Long chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new CustomException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    // 산책 일정 조회
    private WalkSchedule getWalkSchedule(Long walkScheduleId) {
        return walkScheduleRepository.findById(walkScheduleId)
                .orElseThrow(() -> new CustomException(WalkScheduleErrorCode.WALK_SCHEDULE_NOT_FOUND));
    }

    // 회원 조회
    private Member getMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    // 활성 채팅방 참여자 조회
    private ChatRoomMember getActiveChatRoomMember(Long chatRoomId, Long memberId) {
        return chatRoomMemberRepository.findByChatRoomIdAndMemberIdAndStatus(
                        chatRoomId,
                        memberId,
                        ChatRoomMemberStatus.ACTIVE
                )
                .orElseThrow(() -> new CustomException(ChatErrorCode.CHAT_ROOM_ACCESS_DENIED));
    }

    // 활성 채팅방 참여자 검증
    private void validateActiveChatRoomMember(Long chatRoomId, Long memberId) {
        boolean activeMember = chatRoomMemberRepository.existsByChatRoomIdAndMemberIdAndStatus(
                chatRoomId,
                memberId,
                ChatRoomMemberStatus.ACTIVE
        );

        if (!activeMember) {
            throw new CustomException(ChatErrorCode.CHAT_ROOM_ACCESS_DENIED);
        }
    }

    // 채팅방 활성 상태 검증
    private void validateChatRoomActive(ChatRoom chatRoom) {
        if (chatRoom.getStatus() != ChatRoomStatus.ACTIVE) {
            throw new CustomException(ChatErrorCode.CHAT_ROOM_CLOSED);
        }
    }

    // 메시지 검증
    private void validateMessage(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new CustomException(ChatErrorCode.CHAT_MESSAGE_EMPTY);
        }

        if (content.length() > 1000) {
            throw new CustomException(ChatErrorCode.CHAT_MESSAGE_TOO_LONG);
        }
    }

    // 채팅 메시지 알림 생성
    // 차단 관계 채팅 전송 검증
    private void validateNotBlockedChatMember(Long chatRoomId, Long senderId) {
        chatRoomMemberRepository.findAllByChatRoomIdAndStatus(
                        chatRoomId,
                        ChatRoomMemberStatus.ACTIVE
                )
                .stream()
                .map(chatRoomMember -> chatRoomMember.getMember().getId())
                .filter(memberId -> !memberId.equals(senderId))
                .filter(memberId -> memberBlockService.isBlockedBetween(senderId, memberId))
                .findFirst()
                .ifPresent(memberId -> memberBlockService.validateNotBlockedBetween(senderId, memberId));
    }

    // 채팅 메시지 알림 생성
    private void createChatMessageNotifications(
            ChatRoom chatRoom,
            Member sender,
            ChatMessage chatMessage
    ) {
        chatRoomMemberRepository.findAllByChatRoomIdAndStatus(
                        chatRoom.getId(),
                        ChatRoomMemberStatus.ACTIVE
                )
                .stream()
                .filter(chatRoomMember -> !chatRoomMember.getMember().getId().equals(sender.getId()))
                .forEach(chatRoomMember -> notificationService.createNotification(
                        chatRoomMember.getMember(),
                        NotificationType.CHAT_MESSAGE,
                        "새 채팅 메시지가 도착했습니다.",
                        sender.getNickname() + "님: " + summarizeMessage(chatMessage.getContent()),
                        NotificationTargetType.CHAT_ROOM,
                        chatRoom.getId()
                ));
    }

    // 채팅 메시지 알림 내용 축약
    private String summarizeMessage(String content) {
        if (content == null) {
            return "";
        }

        String trimmedContent = content.trim();

        if (trimmedContent.length() <= 40) {
            return trimmedContent;
        }

        return trimmedContent.substring(0, 40) + "...";
    }

    // 최신 메시지 조회
    private ChatMessage getLastMessage(Long chatRoomId) {
        return chatMessageRepository.findTopByChatRoomIdOrderByIdDesc(chatRoomId)
                .orElse(null);
    }

    // 메시지 조회 크기 계산
    private int getPageSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_MESSAGE_SIZE;
        }

        return Math.min(size, MAX_MESSAGE_SIZE);
    }
}
