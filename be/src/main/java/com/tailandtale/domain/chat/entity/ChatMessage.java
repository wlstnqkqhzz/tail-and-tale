package com.tailandtale.domain.chat.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 채팅 메시지 Entity

@Entity
@Table(name = "chat_message")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseEntity {

    // 채팅 메시지 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_message_id")
    private Long id;

    // 채팅방
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    // 보낸 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private Member sender;

    // 메시지 타입
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatMessageType messageType;

    // 메시지 내용
    @Column(nullable = false, length = 1000)
    private String content;

    // 삭제 여부
    @Column(nullable = false)
    private Boolean isDeleted;

    private ChatMessage(
            ChatRoom chatRoom,
            Member sender,
            ChatMessageType messageType,
            String content
    ) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.messageType = messageType;
        this.content = content;
        this.isDeleted = false;
    }

    // 일반 메시지 생성
    public static ChatMessage text(
            ChatRoom chatRoom,
            Member sender,
            String content
    ) {
        return new ChatMessage(
                chatRoom,
                sender,
                ChatMessageType.TEXT,
                content
        );
    }

    // 시스템 메시지 생성
    public static ChatMessage system(
            ChatRoom chatRoom,
            String content
    ) {
        return new ChatMessage(
                chatRoom,
                null,
                ChatMessageType.SYSTEM,
                content
        );
    }

    // 메시지 삭제
    public void delete() {
        this.isDeleted = true;
    }
}
