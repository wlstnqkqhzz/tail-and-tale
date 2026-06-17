package com.tailandtale.domain.chat.repository;

import com.tailandtale.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 채팅 메시지 Repository

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // 최신 메시지 조회
    Optional<ChatMessage> findTopByChatRoomIdOrderByIdDesc(Long chatRoomId);

    // 최신 메시지 목록 조회
    List<ChatMessage> findAllByChatRoomIdOrderByIdDesc(
            Long chatRoomId,
            Pageable pageable
    );

    // 커서 기반 메시지 목록 조회
    List<ChatMessage> findAllByChatRoomIdAndIdLessThanOrderByIdDesc(
            Long chatRoomId,
            Long cursor,
            Pageable pageable
    );
}
