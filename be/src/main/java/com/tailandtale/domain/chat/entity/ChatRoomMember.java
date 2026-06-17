package com.tailandtale.domain.chat.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 채팅방 참여자 Entity

@Entity
@Table(
        name = "chat_room_member",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_room_member",
                columnNames = {"chat_room_id", "member_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoomMember extends BaseEntity {

    // 채팅방 참여자 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_member_id")
    private Long id;

    // 채팅방
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 역할
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomMemberRole role;

    // 참여 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomMemberStatus status;

    // 마지막 읽은 메시지 ID
    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    // 입장일
    @Column(nullable = false)
    private LocalDateTime joinedAt;

    // 퇴장일
    private LocalDateTime leftAt;

    private ChatRoomMember(
            ChatRoom chatRoom,
            Member member,
            ChatRoomMemberRole role
    ) {
        this.chatRoom = chatRoom;
        this.member = member;
        this.role = role;
        this.status = ChatRoomMemberStatus.ACTIVE;
        this.joinedAt = LocalDateTime.now();
    }

    // 채팅방 참여자 생성
    public static ChatRoomMember create(
            ChatRoom chatRoom,
            Member member,
            ChatRoomMemberRole role
    ) {
        return new ChatRoomMember(
                chatRoom,
                member,
                role
        );
    }

    // 재입장 처리
    public void activate(ChatRoomMemberRole role) {
        this.role = role;
        this.status = ChatRoomMemberStatus.ACTIVE;
        this.joinedAt = LocalDateTime.now();
        this.leftAt = null;
    }

    // 퇴장 처리
    public void leave() {
        this.status = ChatRoomMemberStatus.LEFT;
        this.leftAt = LocalDateTime.now();
    }

    // 제거 처리
    public void remove() {
        this.status = ChatRoomMemberStatus.REMOVED;
        this.leftAt = LocalDateTime.now();
    }

    // 읽음 처리
    public void read(Long lastReadMessageId) {
        this.lastReadMessageId = lastReadMessageId;
    }
}
