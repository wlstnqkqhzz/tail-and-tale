package com.tailandtale.domain.chat.repository;

import com.tailandtale.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 채팅방 Repository

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    // 산책 일정 ID로 채팅방 조회
    Optional<ChatRoom> findByWalkScheduleId(Long walkScheduleId);
}
