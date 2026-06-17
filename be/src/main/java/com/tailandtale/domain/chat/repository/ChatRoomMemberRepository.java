package com.tailandtale.domain.chat.repository;

import com.tailandtale.domain.chat.entity.ChatRoomMember;
import com.tailandtale.domain.chat.entity.ChatRoomMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 채팅방 참여자 Repository

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    // 채팅방 참여자 조회
    Optional<ChatRoomMember> findByChatRoomIdAndMemberId(
            Long chatRoomId,
            Long memberId
    );

    // 활성 채팅방 참여자 조회
    Optional<ChatRoomMember> findByChatRoomIdAndMemberIdAndStatus(
            Long chatRoomId,
            Long memberId,
            ChatRoomMemberStatus status
    );

    // 내 채팅방 참여 목록 조회
    List<ChatRoomMember> findAllByMemberIdAndStatusOrderByCreatedAtDesc(
            Long memberId,
            ChatRoomMemberStatus status
    );

    // 채팅방 활성 참여자 목록 조회
    List<ChatRoomMember> findAllByChatRoomIdAndStatus(
            Long chatRoomId,
            ChatRoomMemberStatus status
    );

    // 활성 참여 여부 확인
    boolean existsByChatRoomIdAndMemberIdAndStatus(
            Long chatRoomId,
            Long memberId,
            ChatRoomMemberStatus status
    );
}
