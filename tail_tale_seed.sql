-- ================================================================================================================================
-- Tail & Tale Seed Data
-- 화면 확인용 임시 회원 및 반려견 데이터
-- 테스트 로그인 비밀번호는 모두 1234
-- ================================================================================================================================

USE tail_tale;

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
    '부산',
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
    '미인증집사',
    NULL,
    '01033334444',
    '서울',
    '미인증 반려견 UI 확인용 테스트 회원입니다.',
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
-- 2. 샘플 반려견 초기화
-- ================================================================================================================================

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
    '미인증 상태 UI 확인용 반려견입니다.',
    NOW(),
    NOW()
);
