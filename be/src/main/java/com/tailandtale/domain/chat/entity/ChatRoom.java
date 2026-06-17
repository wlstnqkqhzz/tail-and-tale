package com.tailandtale.domain.chat.entity;

import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 산책 일정 기반 채팅방 Entity

@Entity
@Table(
        name = "chat_room",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_room_walk_schedule",
                columnNames = "walk_schedule_id"
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseEntity {

    // 채팅방 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_id")
    private Long id;

    // 연결된 산책 일정
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_schedule_id", nullable = false)
    private WalkSchedule walkSchedule;

    // 채팅방 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomStatus status;

    private ChatRoom(WalkSchedule walkSchedule) {
        this.walkSchedule = walkSchedule;
        this.status = ChatRoomStatus.ACTIVE;
    }

    // 채팅방 생성
    public static ChatRoom create(WalkSchedule walkSchedule) {
        return new ChatRoom(walkSchedule);
    }

    // 채팅방 활성화
    public void activate() {
        this.status = ChatRoomStatus.ACTIVE;
    }

    // 채팅방 닫기
    public void close() {
        this.status = ChatRoomStatus.CLOSED;
    }
}
