-- ================================================================================================================================
-- Tail & Tale Chat Tables
-- 산책 일정 기반 그룹 채팅
-- ================================================================================================================================

USE tail_tale;

-- ================================================================================================================================
-- 18. 채팅방 테이블
-- 산책 일정 1개당 채팅방 1개를 관리
-- ================================================================================================================================

CREATE TABLE chat_room (
    chat_room_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '채팅방 ID',
    walk_schedule_id BIGINT NOT NULL COMMENT '산책 일정 ID',

    status ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE' COMMENT '채팅방 상태',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_chat_room_walk_schedule FOREIGN KEY (walk_schedule_id) REFERENCES walk_schedule(walk_schedule_id),
    CONSTRAINT uk_chat_room_walk_schedule UNIQUE (walk_schedule_id)
) COMMENT = '채팅방';


-- ================================================================================================================================
-- 19. 채팅방 참여자 테이블
-- 호스트 및 승인된 산책 참여 회원만 채팅방에 입장 가능
-- ================================================================================================================================

CREATE TABLE chat_room_member (
    chat_room_member_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '채팅방 참여자 ID',
    chat_room_id BIGINT NOT NULL COMMENT '채팅방 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    role ENUM('HOST', 'PARTICIPANT') NOT NULL COMMENT '채팅방 역할',
    status ENUM('ACTIVE', 'LEFT', 'REMOVED') NOT NULL DEFAULT 'ACTIVE' COMMENT '채팅방 참여 상태',
    last_read_message_id BIGINT NULL COMMENT '마지막 읽은 메시지 ID',

    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '입장일',
    left_at DATETIME NULL COMMENT '퇴장일',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_chat_room_member_room FOREIGN KEY (chat_room_id) REFERENCES chat_room(chat_room_id),
    CONSTRAINT fk_chat_room_member_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT uk_chat_room_member UNIQUE (chat_room_id, member_id)
) COMMENT = '채팅방 참여자';


-- ================================================================================================================================
-- 20. 채팅 메시지 테이블
-- 채팅방 내 일반 메시지 및 시스템 메시지 관리
-- ================================================================================================================================

CREATE TABLE chat_message (
    chat_message_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '채팅 메시지 ID',
    chat_room_id BIGINT NOT NULL COMMENT '채팅방 ID',
    sender_id BIGINT NULL COMMENT '보낸 회원 ID',

    message_type ENUM('TEXT', 'SYSTEM') NOT NULL DEFAULT 'TEXT' COMMENT '메시지 타입',
    content VARCHAR(1000) NOT NULL COMMENT '메시지 내용',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_chat_message_room FOREIGN KEY (chat_room_id) REFERENCES chat_room(chat_room_id),
    CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES member(member_id)
) COMMENT = '채팅 메시지';


-- ================================================================================================================================
-- Index
-- 채팅방 목록 및 메시지 조회 성능 개선
-- ================================================================================================================================

CREATE INDEX idx_chat_room_member_member_id ON chat_room_member(member_id);
CREATE INDEX idx_chat_room_member_room_status ON chat_room_member(chat_room_id, status);
CREATE INDEX idx_chat_message_room_id_created_at ON chat_message(chat_room_id, created_at);
CREATE INDEX idx_chat_message_room_id_message_id ON chat_message(chat_room_id, chat_message_id);
