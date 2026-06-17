-- ================================================================================================================================
-- Tail & Tale Chat Seed Data
-- 산책 일정 기반 그룹 채팅 화면 확인용 임시 데이터
-- 테스트 로그인 비밀번호는 모두 1234
-- ================================================================================================================================

USE tail_tale;

SET @old_sql_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ================================================================================================================================
-- 1. 샘플 회원
-- ================================================================================================================================

INSERT INTO member (
    email,
    password,
    real_name,
    nickname,
    profile_image_url,
    phone_number,
    region,
    introduction,
    is_real_name_verified,
    real_name_verified_at,
    role,
    status,
    created_at,
    updated_at
) VALUES
(
    'seed1@test.com',
    '$2a$10$b2KVfA8MGVoR4wMaS6ChvuYmccguKeqCppQ0hLWD2h25FWq0bTxVG',
    '김진수',
    '인증집사',
    NULL,
    '01011112222',
    '진주',
    '인증된 반려견을 키우는 테스트 회원입니다.',
    TRUE,
    NOW(),
    'USER',
    'ACTIVE',
    NOW(),
    NOW()
),
(
    'seed2@test.com',
    '$2a$10$b2KVfA8MGVoR4wMaS6ChvuYmccguKeqCppQ0hLWD2h25FWq0bTxVG',
    '박하늘',
    '산책러',
    NULL,
    '01022223333',
    '진주',
    '산책 메이트 기능 확인용 테스트 회원입니다.',
    TRUE,
    NOW(),
    'USER',
    'ACTIVE',
    NOW(),
    NOW()
),
(
    'seed3@test.com',
    '$2a$10$b2KVfA8MGVoR4wMaS6ChvuYmccguKeqCppQ0hLWD2h25FWq0bTxVG',
    '이소라',
    '대기집사',
    NULL,
    '01033334444',
    '진주',
    '승인 대기 상태 확인용 테스트 회원입니다.',
    FALSE,
    NULL,
    'USER',
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    real_name = VALUES(real_name),
    nickname = VALUES(nickname),
    profile_image_url = VALUES(profile_image_url),
    phone_number = VALUES(phone_number),
    region = VALUES(region),
    introduction = VALUES(introduction),
    is_real_name_verified = VALUES(is_real_name_verified),
    real_name_verified_at = VALUES(real_name_verified_at),
    role = VALUES(role),
    status = VALUES(status),
    updated_at = NOW();

SET @seed_member_1 := (SELECT member_id FROM member WHERE email = 'seed1@test.com');
SET @seed_member_2 := (SELECT member_id FROM member WHERE email = 'seed2@test.com');
SET @seed_member_3 := (SELECT member_id FROM member WHERE email = 'seed3@test.com');


-- ================================================================================================================================
-- 2. 기존 샘플 산책/채팅/반려견 초기화
-- ================================================================================================================================

SET @seed_dog_1_old := (SELECT dog_id FROM dog WHERE member_id = @seed_member_1 AND name = '초코' LIMIT 1);
SET @seed_dog_2_old := (SELECT dog_id FROM dog WHERE member_id = @seed_member_1 AND name = '보리' LIMIT 1);
SET @seed_dog_3_old := (SELECT dog_id FROM dog WHERE member_id = @seed_member_2 AND name = '콩이' LIMIT 1);
SET @seed_dog_4_old := (SELECT dog_id FROM dog WHERE member_id = @seed_member_3 AND name = '루루' LIMIT 1);

DELETE FROM chat_message
WHERE chat_room_id IN (
    SELECT chat_room_id
    FROM chat_room
    WHERE walk_schedule_id IN (
        SELECT walk_schedule_id
        FROM walk_schedule
        WHERE host_member_id IN (@seed_member_1, @seed_member_2, @seed_member_3)
           OR host_dog_id IN (@seed_dog_1_old, @seed_dog_2_old, @seed_dog_3_old, @seed_dog_4_old)
    )
);

DELETE FROM chat_room_member
WHERE chat_room_id IN (
    SELECT chat_room_id
    FROM chat_room
    WHERE walk_schedule_id IN (
        SELECT walk_schedule_id
        FROM walk_schedule
        WHERE host_member_id IN (@seed_member_1, @seed_member_2, @seed_member_3)
           OR host_dog_id IN (@seed_dog_1_old, @seed_dog_2_old, @seed_dog_3_old, @seed_dog_4_old)
    )
);

DELETE FROM chat_room
WHERE walk_schedule_id IN (
    SELECT walk_schedule_id
    FROM walk_schedule
    WHERE host_member_id IN (@seed_member_1, @seed_member_2, @seed_member_3)
       OR host_dog_id IN (@seed_dog_1_old, @seed_dog_2_old, @seed_dog_3_old, @seed_dog_4_old)
);

DELETE FROM walk_participant
WHERE walk_schedule_id IN (
    SELECT walk_schedule_id
    FROM walk_schedule
    WHERE host_member_id IN (@seed_member_1, @seed_member_2, @seed_member_3)
       OR host_dog_id IN (@seed_dog_1_old, @seed_dog_2_old, @seed_dog_3_old, @seed_dog_4_old)
);

DELETE FROM walk_schedule
WHERE host_member_id IN (@seed_member_1, @seed_member_2, @seed_member_3)
   OR host_dog_id IN (@seed_dog_1_old, @seed_dog_2_old, @seed_dog_3_old, @seed_dog_4_old);

DELETE FROM dog
WHERE member_id IN (@seed_member_1, @seed_member_2, @seed_member_3);


-- ================================================================================================================================
-- 3. 샘플 반려견
-- ================================================================================================================================

INSERT INTO dog (
    member_id,
    name,
    breed,
    gender,
    birth_date,
    weight,
    size,
    personality,
    profile_image_url,
    animal_registration_number,
    is_verified,
    verified_at,
    is_neutered,
    note,
    created_at,
    updated_at
) VALUES
(
    @seed_member_1,
    '초코',
    '푸들',
    'MALE',
    '2022-03-15',
    5.80,
    'SMALL',
    '산책을 좋아하고 활발합니다.',
    NULL,
    '410000000000001',
    TRUE,
    NOW(),
    TRUE,
    '인증 뱃지 UI 확인용 반려견입니다.',
    NOW(),
    NOW()
),
(
    @seed_member_1,
    '보리',
    '말티즈',
    'FEMALE',
    '2021-09-20',
    4.20,
    'SMALL',
    '낯가림이 있지만 보호자에게는 애교가 많습니다.',
    NULL,
    '410000000000002',
    TRUE,
    NOW(),
    TRUE,
    '동물등록번호 인증 완료 상태입니다.',
    NOW(),
    NOW()
),
(
    @seed_member_2,
    '콩이',
    '시바견',
    'MALE',
    '2020-05-08',
    10.50,
    'MEDIUM',
    '독립적이고 산책 속도가 빠릅니다.',
    NULL,
    '410000000000003',
    TRUE,
    NOW(),
    FALSE,
    '산책 일정 테스트용 인증 반려견입니다.',
    NOW(),
    NOW()
),
(
    @seed_member_3,
    '루루',
    '믹스견',
    'UNKNOWN',
    '2023-01-12',
    7.30,
    'MEDIUM',
    '새로운 환경에 조심스럽게 적응합니다.',
    NULL,
    NULL,
    FALSE,
    NULL,
    FALSE,
    '승인 대기 상태 UI 확인용 반려견입니다.',
    NOW(),
    NOW()
);

SET @seed_dog_1 := (SELECT dog_id FROM dog WHERE member_id = @seed_member_1 AND name = '초코' LIMIT 1);
SET @seed_dog_2 := (SELECT dog_id FROM dog WHERE member_id = @seed_member_1 AND name = '보리' LIMIT 1);
SET @seed_dog_3 := (SELECT dog_id FROM dog WHERE member_id = @seed_member_2 AND name = '콩이' LIMIT 1);
SET @seed_dog_4 := (SELECT dog_id FROM dog WHERE member_id = @seed_member_3 AND name = '루루' LIMIT 1);


-- ================================================================================================================================
-- 4. 샘플 산책 일정
-- ================================================================================================================================

INSERT INTO walk_schedule (
    host_member_id,
    host_dog_id,
    title,
    description,
    region,
    meeting_place,
    latitude,
    longitude,
    scheduled_at,
    expected_duration_minutes,
    max_participants,
    preferred_dog_size,
    preferred_personality,
    status,
    created_at,
    updated_at
) VALUES
(
    @seed_member_1,
    @seed_dog_1,
    '남강공원 저녁 산책 메이트 구해요',
    '잔잔한 강변길에서 천천히 걷는 45분 코스입니다.',
    '경남 진주',
    '남강공원 정문',
    35.1928000,
    128.0841000,
    DATE_ADD(NOW(), INTERVAL 2 DAY),
    45,
    4,
    'ANY',
    '사교적인 강아지',
    'OPEN',
    NOW(),
    NOW()
),
(
    @seed_member_2,
    @seed_dog_3,
    '초전공원 소형견 모임',
    '낯가림 적은 친구들과 가볍게 인사하고 걷는 모임입니다.',
    '경남 진주',
    '초전공원 분수대 앞',
    35.2123000,
    128.1123000,
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    60,
    3,
    'SMALL',
    '천천히 걷는 강아지',
    'OPEN',
    NOW(),
    NOW()
);

SET @seed_walk_1 := (
    SELECT walk_schedule_id
    FROM walk_schedule
    WHERE host_member_id = @seed_member_1
      AND title = '남강공원 저녁 산책 메이트 구해요'
    LIMIT 1
);

SET @seed_walk_2 := (
    SELECT walk_schedule_id
    FROM walk_schedule
    WHERE host_member_id = @seed_member_2
      AND title = '초전공원 소형견 모임'
    LIMIT 1
);


-- ================================================================================================================================
-- 5. 샘플 산책 참여
-- 승인된 회원만 채팅방에 포함
-- ================================================================================================================================

INSERT INTO walk_participant (
    walk_schedule_id,
    member_id,
    dog_id,
    status,
    message,
    created_at,
    updated_at
) VALUES
(
    @seed_walk_1,
    @seed_member_2,
    @seed_dog_3,
    'APPROVED',
    '콩이와 함께 천천히 걸어보고 싶어요.',
    NOW(),
    NOW()
),
(
    @seed_walk_1,
    @seed_member_3,
    @seed_dog_4,
    'REQUESTED',
    '루루가 아직 낯을 가려서 조심스럽게 신청합니다.',
    NOW(),
    NOW()
),
(
    @seed_walk_2,
    @seed_member_1,
    @seed_dog_2,
    'APPROVED',
    '보리와 함께 참여하고 싶습니다.',
    NOW(),
    NOW()
);


-- ================================================================================================================================
-- 6. 샘플 채팅방
-- 산책 일정 1개당 채팅방 1개
-- ================================================================================================================================

INSERT INTO chat_room (
    walk_schedule_id,
    status,
    created_at,
    updated_at
) VALUES
(
    @seed_walk_1,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    @seed_walk_2,
    'ACTIVE',
    NOW(),
    NOW()
);

SET @seed_chat_room_1 := (SELECT chat_room_id FROM chat_room WHERE walk_schedule_id = @seed_walk_1 LIMIT 1);
SET @seed_chat_room_2 := (SELECT chat_room_id FROM chat_room WHERE walk_schedule_id = @seed_walk_2 LIMIT 1);


-- ================================================================================================================================
-- 7. 샘플 채팅방 참여자
-- 호스트와 APPROVED 참여자만 ACTIVE
-- ================================================================================================================================

INSERT INTO chat_room_member (
    chat_room_id,
    member_id,
    role,
    status,
    last_read_message_id,
    joined_at,
    left_at,
    created_at,
    updated_at
) VALUES
(
    @seed_chat_room_1,
    @seed_member_1,
    'HOST',
    'ACTIVE',
    NULL,
    NOW(),
    NULL,
    NOW(),
    NOW()
),
(
    @seed_chat_room_1,
    @seed_member_2,
    'PARTICIPANT',
    'ACTIVE',
    NULL,
    NOW(),
    NULL,
    NOW(),
    NOW()
),
(
    @seed_chat_room_2,
    @seed_member_2,
    'HOST',
    'ACTIVE',
    NULL,
    NOW(),
    NULL,
    NOW(),
    NOW()
),
(
    @seed_chat_room_2,
    @seed_member_1,
    'PARTICIPANT',
    'ACTIVE',
    NULL,
    NOW(),
    NULL,
    NOW(),
    NOW()
);


-- ================================================================================================================================
-- 8. 샘플 채팅 메시지
-- ================================================================================================================================

INSERT INTO chat_message (
    chat_room_id,
    sender_id,
    message_type,
    content,
    is_deleted,
    created_at,
    updated_at
) VALUES
(
    @seed_chat_room_1,
    NULL,
    'SYSTEM',
    '산책 채팅방이 생성되었습니다.',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 30 MINUTE),
    DATE_SUB(NOW(), INTERVAL 30 MINUTE)
),
(
    @seed_chat_room_1,
    @seed_member_1,
    'TEXT',
    '안녕하세요. 남강공원 정문에서 만나면 될 것 같아요.',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 25 MINUTE),
    DATE_SUB(NOW(), INTERVAL 25 MINUTE)
),
(
    @seed_chat_room_1,
    @seed_member_2,
    'TEXT',
    '좋습니다. 콩이랑 시간 맞춰서 갈게요!',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 20 MINUTE),
    DATE_SUB(NOW(), INTERVAL 20 MINUTE)
),
(
    @seed_chat_room_2,
    NULL,
    'SYSTEM',
    '산책 채팅방이 생성되었습니다.',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 18 MINUTE),
    DATE_SUB(NOW(), INTERVAL 18 MINUTE)
),
(
    @seed_chat_room_2,
    @seed_member_2,
    'TEXT',
    '초전공원 분수대 앞에서 뵐게요.',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 10 MINUTE),
    DATE_SUB(NOW(), INTERVAL 10 MINUTE)
),
(
    @seed_chat_room_2,
    @seed_member_1,
    'TEXT',
    '네, 보리 데리고 천천히 가겠습니다.',
    FALSE,
    DATE_SUB(NOW(), INTERVAL 5 MINUTE),
    DATE_SUB(NOW(), INTERVAL 5 MINUTE)
);

SET @seed_chat_room_1_last_message := (
    SELECT MAX(chat_message_id)
    FROM chat_message
    WHERE chat_room_id = @seed_chat_room_1
);

SET @seed_chat_room_2_last_message := (
    SELECT MAX(chat_message_id)
    FROM chat_message
    WHERE chat_room_id = @seed_chat_room_2
);

UPDATE chat_room_member
SET last_read_message_id = @seed_chat_room_1_last_message
WHERE chat_room_id = @seed_chat_room_1;

UPDATE chat_room_member
SET last_read_message_id = @seed_chat_room_2_last_message
WHERE chat_room_id = @seed_chat_room_2;

SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
