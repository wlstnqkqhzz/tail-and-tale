-- ================================================================================================================================
-- Tail & Tale Database
-- ================================================================================================================================

CREATE DATABASE IF NOT EXISTS tail_tale
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE tail_tale;

DROP TABLE IF EXISTS ai_analysis_result;
DROP TABLE IF EXISTS post_like;
DROP TABLE IF EXISTS post_comment;
DROP TABLE IF EXISTS post_image;
DROP TABLE IF EXISTS community_post;
DROP TABLE IF EXISTS emotion_diary;
DROP TABLE IF EXISTS hospital_record;
DROP TABLE IF EXISTS vaccination_record;
DROP TABLE IF EXISTS health_record;
DROP TABLE IF EXISTS walk_review;
DROP TABLE IF EXISTS walk_record;
DROP TABLE IF EXISTS walk_participant;
DROP TABLE IF EXISTS walk_schedule;
DROP TABLE IF EXISTS refresh_token;
DROP TABLE IF EXISTS oauth_account;
DROP TABLE IF EXISTS dog;
DROP TABLE IF EXISTS member;


-- ================================================================================================================================
-- 1. 회원 테이블
-- 반려인 기본 정보, 실명 인증, 권한, 활동 상태 관리
-- ================================================================================================================================

CREATE TABLE member (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '회원 ID',

    email VARCHAR(100) NOT NULL COMMENT '이메일',
    password VARCHAR(255) NULL COMMENT '비밀번호',
    real_name VARCHAR(50) NOT NULL COMMENT '실명',
    nickname VARCHAR(30) NOT NULL COMMENT '닉네임',
    profile_image_url VARCHAR(500) NULL COMMENT '프로필 이미지 URL',

    phone_number VARCHAR(20) NULL COMMENT '전화번호',
    region VARCHAR(100) NULL COMMENT '거주 지역',
    introduction VARCHAR(300) NULL COMMENT '자기소개',

    is_real_name_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '실명 인증 여부',
    real_name_verified_at DATETIME NULL COMMENT '실명 인증 완료일',

    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER' COMMENT '회원 권한',
    status ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE' COMMENT '회원 상태',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입일',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT uk_member_email UNIQUE (email),
    CONSTRAINT uk_member_nickname UNIQUE (nickname)
) COMMENT = '회원';


-- ================================================================================================================================
-- 2. OAuth 계정 테이블
-- 네이버, 구글, 카카오 등 외부 로그인 계정 연동 정보 관리
-- 회원과 OAuth 계정을 분리하여 한 회원이 여러 OAuth 계정을 연결할 수 있도록 구성
-- ================================================================================================================================

CREATE TABLE oauth_account (
    oauth_account_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'OAuth 계정 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    provider ENUM('GOOGLE', 'NAVER', 'KAKAO') NOT NULL COMMENT 'OAuth 제공자',
    provider_user_id VARCHAR(100) NOT NULL COMMENT 'OAuth 제공자 회원 식별값',
    provider_email VARCHAR(100) NULL COMMENT 'OAuth 제공자 이메일',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '연동일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_oauth_account_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT uk_oauth_provider_user UNIQUE (provider, provider_user_id)
) COMMENT = 'OAuth 계정';


-- ================================================================================================================================
-- 3. 리프레시 토큰 테이블
-- JWT 재발급, 로그인 유지, 기기별 로그아웃 관리를 위한 Refresh Token 관리
-- Access Token은 DB에 저장하지 않고 서버에서 서명 검증만 수행
-- ================================================================================================================================

CREATE TABLE refresh_token (
    refresh_token_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '리프레시 토큰 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    token VARCHAR(500) NOT NULL COMMENT '리프레시 토큰',
    device_id VARCHAR(100) NULL COMMENT '기기 식별값',
    user_agent VARCHAR(500) NULL COMMENT '접속 기기 정보',
    ip_address VARCHAR(45) NULL COMMENT '접속 IP',

    expires_at DATETIME NOT NULL COMMENT '만료일',
    revoked_at DATETIME NULL COMMENT '폐기일',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_refresh_token_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT uk_refresh_token_token UNIQUE (token)
) COMMENT = '리프레시 토큰';


-- ================================================================================================================================
-- 4. 반려견 테이블
-- 회원이 등록한 반려견 기본 정보 및 동물등록번호 기반 인증 정보 관리
-- ================================================================================================================================

CREATE TABLE dog (
    dog_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '반려견 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    name VARCHAR(30) NOT NULL COMMENT '반려견 이름',
    breed VARCHAR(50) NULL COMMENT '견종',
    gender ENUM('MALE', 'FEMALE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' COMMENT '성별',
    birth_date DATE NULL COMMENT '생년월일',
    weight DECIMAL(5,2) NULL COMMENT '몸무게(kg)',
    size ENUM('SMALL', 'MEDIUM', 'LARGE') NULL COMMENT '크기',
    personality VARCHAR(200) NULL COMMENT '성향',
    profile_image_url VARCHAR(500) NULL COMMENT '반려견 프로필 이미지 URL',

    animal_registration_number VARCHAR(50) NULL COMMENT '동물등록번호',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '반려견 인증 여부',
    verified_at DATETIME NULL COMMENT '반려견 인증 완료일',

    is_neutered BOOLEAN NOT NULL DEFAULT FALSE COMMENT '중성화 여부',
    note VARCHAR(500) NULL COMMENT '특이사항',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_dog_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT uk_dog_animal_registration_number UNIQUE (animal_registration_number)
) COMMENT = '반려견';


-- ================================================================================================================================
-- 5. 산책 일정 테이블
-- 산책 메이트 모집을 위한 일정 정보 관리
-- ================================================================================================================================

CREATE TABLE walk_schedule (
    walk_schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '산책 일정 ID',
    host_member_id BIGINT NOT NULL COMMENT '일정 등록 회원 ID',
    host_dog_id BIGINT NOT NULL COMMENT '일정 등록 반려견 ID',

    title VARCHAR(100) NOT NULL COMMENT '산책 일정 제목',
    description VARCHAR(1000) NULL COMMENT '산책 일정 설명',

    region VARCHAR(100) NOT NULL COMMENT '산책 지역',
    meeting_place VARCHAR(200) NOT NULL COMMENT '만남 장소',
    latitude DECIMAL(10,7) NULL COMMENT '위도',
    longitude DECIMAL(10,7) NULL COMMENT '경도',

    scheduled_at DATETIME NOT NULL COMMENT '산책 예정 일시',
    expected_duration_minutes INT NULL COMMENT '예상 산책 시간(분)',
    max_participants INT NOT NULL DEFAULT 4 COMMENT '최대 참여 인원',

    preferred_dog_size ENUM('ANY', 'SMALL', 'MEDIUM', 'LARGE') NOT NULL DEFAULT 'ANY' COMMENT '선호 반려견 크기',
    preferred_personality VARCHAR(200) NULL COMMENT '선호 반려견 성향',

    status ENUM('OPEN', 'CLOSED', 'CANCELED', 'COMPLETED') NOT NULL DEFAULT 'OPEN' COMMENT '일정 상태',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_walk_schedule_host_member FOREIGN KEY (host_member_id) REFERENCES member(member_id),
    CONSTRAINT fk_walk_schedule_host_dog FOREIGN KEY (host_dog_id) REFERENCES dog(dog_id)
) COMMENT = '산책 일정';


-- ================================================================================================================================
-- 6. 산책 참여 테이블
-- 산책 일정에 참여하는 회원 및 반려견 관리
-- ================================================================================================================================

CREATE TABLE walk_participant (
    walk_participant_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '산책 참여 ID',
    walk_schedule_id BIGINT NOT NULL COMMENT '산책 일정 ID',
    member_id BIGINT NOT NULL COMMENT '참여 회원 ID',
    dog_id BIGINT NOT NULL COMMENT '참여 반려견 ID',

    status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'REQUESTED' COMMENT '참여 상태',
    message VARCHAR(300) NULL COMMENT '참여 신청 메시지',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_walk_participant_schedule FOREIGN KEY (walk_schedule_id) REFERENCES walk_schedule(walk_schedule_id),
    CONSTRAINT fk_walk_participant_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_walk_participant_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id),
    CONSTRAINT uk_walk_participant UNIQUE (walk_schedule_id, member_id, dog_id)
) COMMENT = '산책 참여';


-- ================================================================================================================================
-- 7. 산책 기록 테이블
-- 실제 산책 거리, 시간, 경로, 컨디션 기록 관리
-- ================================================================================================================================

CREATE TABLE walk_record (
    walk_record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '산책 기록 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',
    walk_schedule_id BIGINT NULL COMMENT '연결된 산책 일정 ID',

    started_at DATETIME NOT NULL COMMENT '산책 시작 일시',
    ended_at DATETIME NULL COMMENT '산책 종료 일시',
    duration_minutes INT NULL COMMENT '산책 시간(분)',
    distance_km DECIMAL(6,2) NULL COMMENT '산책 거리(km)',

    route_summary VARCHAR(500) NULL COMMENT '산책 경로 요약',
    memo VARCHAR(1000) NULL COMMENT '산책 메모',
    condition_after_walk ENUM('VERY_GOOD', 'GOOD', 'NORMAL', 'TIRED', 'BAD') NULL COMMENT '산책 후 컨디션',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_walk_record_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_walk_record_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id),
    CONSTRAINT fk_walk_record_schedule FOREIGN KEY (walk_schedule_id) REFERENCES walk_schedule(walk_schedule_id)
) COMMENT = '산책 기록';


-- ================================================================================================================================
-- 8. 산책 후기 테이블
-- 산책 메이트 후기 및 평가 관리
-- ================================================================================================================================

CREATE TABLE walk_review (
    walk_review_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '산책 후기 ID',
    walk_schedule_id BIGINT NOT NULL COMMENT '산책 일정 ID',
    reviewer_id BIGINT NOT NULL COMMENT '작성 회원 ID',
    reviewee_id BIGINT NOT NULL COMMENT '평가 대상 회원 ID',

    rating TINYINT NOT NULL COMMENT '평점',
    content VARCHAR(1000) NULL COMMENT '후기 내용',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_walk_review_schedule FOREIGN KEY (walk_schedule_id) REFERENCES walk_schedule(walk_schedule_id),
    CONSTRAINT fk_walk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES member(member_id),
    CONSTRAINT fk_walk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES member(member_id),
    CONSTRAINT ck_walk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uk_walk_review UNIQUE (walk_schedule_id, reviewer_id, reviewee_id)
) COMMENT = '산책 후기';


-- ================================================================================================================================
-- 9. 건강 기록 테이블
-- 반려견 체중, 건강 상태, 증상 기록 관리
-- ================================================================================================================================

CREATE TABLE health_record (
    health_record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '건강 기록 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',

    recorded_date DATE NOT NULL COMMENT '기록일',
    weight DECIMAL(5,2) NULL COMMENT '몸무게(kg)',
    health_status ENUM('VERY_GOOD', 'GOOD', 'NORMAL', 'WATCH', 'BAD') NULL COMMENT '건강 상태',
    symptoms VARCHAR(500) NULL COMMENT '증상',
    memo VARCHAR(1000) NULL COMMENT '건강 메모',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_health_record_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id)
) COMMENT = '건강 기록';


-- ================================================================================================================================
-- 10. 예방접종 기록 테이블
-- 반려견 예방접종 내역 및 다음 접종일 관리
-- ================================================================================================================================

CREATE TABLE vaccination_record (
    vaccination_record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '예방접종 기록 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',

    vaccine_name VARCHAR(100) NOT NULL COMMENT '백신명',
    vaccinated_date DATE NOT NULL COMMENT '접종일',
    next_due_date DATE NULL COMMENT '다음 접종 예정일',
    hospital_name VARCHAR(100) NULL COMMENT '병원명',
    memo VARCHAR(500) NULL COMMENT '접종 메모',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_vaccination_record_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id)
) COMMENT = '예방접종 기록';


-- ================================================================================================================================
-- 11. 병원 방문 기록 테이블
-- 반려견 진료, 검사, 처방 내역 관리
-- ================================================================================================================================

CREATE TABLE hospital_record (
    hospital_record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '병원 방문 기록 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',

    visited_date DATE NOT NULL COMMENT '방문일',
    hospital_name VARCHAR(100) NOT NULL COMMENT '병원명',
    reason VARCHAR(300) NULL COMMENT '방문 사유',
    diagnosis VARCHAR(500) NULL COMMENT '진단 내용',
    treatment VARCHAR(500) NULL COMMENT '치료 및 처방 내용',
    cost INT NULL COMMENT '진료 비용',
    next_visit_date DATE NULL COMMENT '다음 방문 예정일',
    memo VARCHAR(1000) NULL COMMENT '방문 메모',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_hospital_record_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id)
) COMMENT = '병원 방문 기록';


-- ================================================================================================================================
-- 12. 감정 다이어리 테이블
-- 반려견 감정, 행동 패턴, 산책 후 컨디션 기록 관리
-- ================================================================================================================================

CREATE TABLE emotion_diary (
    emotion_diary_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '감정 다이어리 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',
    walk_record_id BIGINT NULL COMMENT '연결된 산책 기록 ID',

    recorded_date DATE NOT NULL COMMENT '기록일',
    emotion ENUM('HAPPY', 'CALM', 'EXCITED', 'ANXIOUS', 'SAD', 'ANGRY', 'TIRED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' COMMENT '감정 상태',
    behavior_pattern VARCHAR(500) NULL COMMENT '행동 패턴',
    condition_level TINYINT NULL COMMENT '컨디션 점수',
    diary_content VARCHAR(1500) NULL COMMENT '다이어리 내용',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_emotion_diary_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id),
    CONSTRAINT fk_emotion_diary_walk_record FOREIGN KEY (walk_record_id) REFERENCES walk_record(walk_record_id),
    CONSTRAINT ck_emotion_diary_condition_level CHECK (condition_level IS NULL OR condition_level BETWEEN 1 AND 5)
) COMMENT = '감정 다이어리';


-- ================================================================================================================================
-- 13. 커뮤니티 게시글 테이블
-- 산책 후기, 반려견 일상, 육아 정보 게시글 관리
-- ================================================================================================================================

CREATE TABLE community_post (
    community_post_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '커뮤니티 게시글 ID',
    member_id BIGINT NOT NULL COMMENT '작성 회원 ID',
    dog_id BIGINT NULL COMMENT '관련 반려견 ID',

    category ENUM('WALK_REVIEW', 'DAILY', 'CARE_INFO', 'QUESTION', 'NOTICE') NOT NULL DEFAULT 'DAILY' COMMENT '게시글 카테고리',
    title VARCHAR(150) NOT NULL COMMENT '게시글 제목',
    content TEXT NOT NULL COMMENT '게시글 내용',
    view_count INT NOT NULL DEFAULT 0 COMMENT '조회수',
    like_count INT NOT NULL DEFAULT 0 COMMENT '좋아요 수',
    comment_count INT NOT NULL DEFAULT 0 COMMENT '댓글 수',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_community_post_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_community_post_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id)
) COMMENT = '커뮤니티 게시글';


-- ================================================================================================================================
-- 14. 게시글 이미지 테이블
-- 커뮤니티 게시글에 첨부된 이미지 관리
-- ================================================================================================================================

CREATE TABLE post_image (
    post_image_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '게시글 이미지 ID',
    community_post_id BIGINT NOT NULL COMMENT '커뮤니티 게시글 ID',

    image_url VARCHAR(500) NOT NULL COMMENT '이미지 URL',
    image_order INT NOT NULL DEFAULT 0 COMMENT '이미지 순서',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',

    CONSTRAINT fk_post_image_community_post FOREIGN KEY (community_post_id) REFERENCES community_post(community_post_id)
) COMMENT = '게시글 이미지';


-- ================================================================================================================================
-- 15. 댓글 테이블
-- 커뮤니티 게시글 댓글 및 대댓글 관리
-- ================================================================================================================================

CREATE TABLE post_comment (
    post_comment_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '댓글 ID',
    community_post_id BIGINT NOT NULL COMMENT '커뮤니티 게시글 ID',
    member_id BIGINT NOT NULL COMMENT '작성 회원 ID',
    parent_comment_id BIGINT NULL COMMENT '부모 댓글 ID',

    content VARCHAR(1000) NOT NULL COMMENT '댓글 내용',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    CONSTRAINT fk_post_comment_community_post FOREIGN KEY (community_post_id) REFERENCES community_post(community_post_id),
    CONSTRAINT fk_post_comment_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT fk_post_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES post_comment(post_comment_id)
) COMMENT = '댓글';


-- ================================================================================================================================
-- 16. 게시글 좋아요 테이블
-- 커뮤니티 게시글 좋아요 중복 방지 및 이력 관리
-- ================================================================================================================================

CREATE TABLE post_like (
    post_like_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '게시글 좋아요 ID',
    community_post_id BIGINT NOT NULL COMMENT '커뮤니티 게시글 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',

    CONSTRAINT fk_post_like_community_post FOREIGN KEY (community_post_id) REFERENCES community_post(community_post_id),
    CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT uk_post_like UNIQUE (community_post_id, member_id)
) COMMENT = '게시글 좋아요';


-- ================================================================================================================================
-- 17. AI 분석 결과 테이블
-- 산책, 건강, 감정 데이터를 기반으로 생성된 AI 분석 결과 관리
-- ================================================================================================================================

CREATE TABLE ai_analysis_result (
    ai_analysis_result_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'AI 분석 결과 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',
    member_id BIGINT NOT NULL COMMENT '회원 ID',

    analysis_type ENUM('WALK_ACTIVITY', 'EMOTION_PATTERN', 'HEALTH_RISK', 'CARE_GUIDE') NOT NULL COMMENT '분석 유형',
    target_start_date DATE NULL COMMENT '분석 시작일',
    target_end_date DATE NULL COMMENT '분석 종료일',

    summary VARCHAR(500) NOT NULL COMMENT '분석 요약',
    result_content TEXT NOT NULL COMMENT '분석 상세 내용',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NULL COMMENT '위험도',
    guide_content TEXT NULL COMMENT '맞춤형 관리 가이드',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',

    CONSTRAINT fk_ai_analysis_result_dog FOREIGN KEY (dog_id) REFERENCES dog(dog_id),
    CONSTRAINT fk_ai_analysis_result_member FOREIGN KEY (member_id) REFERENCES member(member_id)
) COMMENT = 'AI 분석 결과';


-- ================================================================================================================================
-- Index
-- 주요 조회 조건에 대한 인덱스
-- ================================================================================================================================

CREATE INDEX idx_refresh_token_member_id ON refresh_token(member_id);
CREATE INDEX idx_refresh_token_expires_at ON refresh_token(expires_at);
CREATE INDEX idx_oauth_account_member_id ON oauth_account(member_id);
CREATE INDEX idx_dog_member_id ON dog(member_id);
CREATE INDEX idx_walk_schedule_region_status ON walk_schedule(region, status);
CREATE INDEX idx_walk_schedule_scheduled_at ON walk_schedule(scheduled_at);
CREATE INDEX idx_walk_participant_schedule_id ON walk_participant(walk_schedule_id);
CREATE INDEX idx_walk_record_dog_started_at ON walk_record(dog_id, started_at);
CREATE INDEX idx_health_record_dog_recorded_date ON health_record(dog_id, recorded_date);
CREATE INDEX idx_emotion_diary_dog_recorded_date ON emotion_diary(dog_id, recorded_date);
CREATE INDEX idx_community_post_category_created_at ON community_post(category, created_at);
CREATE INDEX idx_post_comment_post_id ON post_comment(community_post_id);
CREATE INDEX idx_ai_analysis_result_dog_type ON ai_analysis_result(dog_id, analysis_type);
