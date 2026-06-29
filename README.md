# Tail & Tale

반려견 보호자를 위한 산책 메이트 매칭 및 케어 기록 관리 플랫폼

Spring Boot + React 기반으로 개발된 반려견 산책/케어 서비스입니다.

사용자는 회원가입 및 로그인을 통해 반려견을 등록하고, 지역과 일정에 맞는 산책 모집글을 작성하거나 참여 신청을 할 수 있습니다. 산책 참여가 승인되면 채팅방에서 실시간으로 소통할 수 있으며, 산책 후에는 후기와 케어 기록을 남길 수 있습니다.

또한 JWT 인증, OAuth2 로그인, refreshToken httpOnly Cookie, 1회용 OAuth2 code 교환 방식, 마이페이지, 알림 설정, 신고/차단, 관리자 신고 처리, 신뢰도/뱃지 시스템을 포함하여 사용자 인증부터 서비스 운영 관리까지 가능한 구조로 구현하였습니다.

관리자는 신고된 회원, 게시글, 댓글, 채팅 메시지를 확인하고 처리할 수 있으며, 사용자는 차단 기능을 통해 특정 회원의 게시글, 댓글, 산책 모집글, 채팅 상호작용을 제한할 수 있습니다. 산책과 커뮤니티 목록에는 검색 조건을 유지하는 페이징을 적용하고, 댓글은 답글이 부모 댓글과 분리되지 않도록 최상위 댓글 단위로 페이지를 구성합니다.

## 프로젝트 구조

```text
Tail-And-Tale/
├── be/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/tailandtale/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── admin/          # 관리자 대시보드, 회원/신고/콘텐츠 관리
│   │   │   │   │   ├── care/           # 산책 기록, 감정 일기, 건강 기록, 케어 결산
│   │   │   │   │   ├── chat/           # 산책 채팅방, 메시지, 읽음 처리
│   │   │   │   │   ├── community/      # 커뮤니티 게시글, 댓글, 좋아요
│   │   │   │   │   ├── dog/            # 반려견 등록, 수정, 인증, 이미지 업로드
│   │   │   │   │   ├── member/         # 회원, 인증, OAuth2, 토큰, 차단, 신뢰도/뱃지
│   │   │   │   │   ├── notification/   # 알림 및 알림 설정
│   │   │   │   │   ├── report/         # 신고 등록 및 신고 처리
│   │   │   │   │   └── walk/           # 산책 모집, 참여 신청, 후기, 자동 완료
│   │   │   │   ├── global/             # 공통 설정, JWT, 예외 처리, 보안 설정
│   │   │   │   └── BeApplication.java  # Spring Boot 실행 클래스
│   │   │   └── resources/
│   │   │       ├── application.yaml     # Spring Boot 공통 설정
│   │   │       └── application-local.yaml # 로컬 DB, OAuth2, JWT, Gemini 설정
│   │   └── test/                        # 테스트 코드
│   └── pom.xml                          # Maven 의존성 및 빌드 설정
│
├── fe/
│   ├── src/
│   │   ├── api/                         # Axios 기반 도메인별 API 요청
│   │   ├── assets/icons/
│   │   │   ├── badges/                  # 뱃지 아이콘
│   │   │   └── conditions/              # 컨디션 아이콘
│   │   ├── components/
│   │   │   ├── auth/                    # 로그인 및 OAuth2 접근 제어
│   │   │   ├── care/                    # 케어 요약, 기록, 결산 UI
│   │   │   ├── common/                  # 페이징, 지역 선택, 토스트
│   │   │   ├── community/               # 게시글 이미지 업로더
│   │   │   ├── dog/                     # 반려견 관리 UI
│   │   │   ├── home/                    # 홈 화면 섹션
│   │   │   ├── layout/                  # 공통 헤더
│   │   │   ├── member/                  # 사용자 미니 프로필
│   │   │   ├── profile/                 # 마이페이지 구성 요소
│   │   │   ├── report/                  # 신고 모달
│   │   │   └── walk/                    # 산책 상세 및 상태 UI
│   │   ├── constants/                   # 화면 상수, 지역, 아이콘 매핑
│   │   ├── hooks/                       # 인증, 드롭다운, 모달 훅
│   │   ├── pages/
│   │   │   ├── admin/                   # 관리자 페이지
│   │   │   ├── auth/                    # OAuth2 처리 페이지
│   │   │   ├── care/                    # 케어 기록 페이지
│   │   │   ├── chat/                    # 채팅방 목록 및 상세
│   │   │   ├── community/               # 커뮤니티 목록, 상세, 작성, 수정
│   │   │   ├── dog/                     # 반려견 관리 페이지
│   │   │   ├── home/                    # 메인 페이지
│   │   │   ├── member/                  # 프로필 및 마이페이지
│   │   │   └── walk/                    # 산책 목록, 상세, 작성
│   │   ├── routes/                      # React Router 설정
│   │   └── utils/                       # 포맷터, 토큰, 읽음 기록, STOMP 유틸
│   ├── package.json                     # 프론트엔드 의존성 및 스크립트
│   └── vite.config.js                   # Vite 설정
│
├── docs/
│   └── sql/                             # 전체 스키마 및 seed SQL
├── uploads/                             # 반려견 및 게시글 업로드 파일
└── README.md
```

## 주요 기능

<details>
<summary>클릭하여 주요 기능 상세 펼치기</summary>

### 회원 및 인증

- 로컬 회원가입 / 로그인
- Google, Kakao, Naver OAuth2 로그인
- OAuth2 최초 로그인 시 추가 프로필 입력
- accessToken body 응답
- refreshToken httpOnly Cookie 저장
- OAuth2 1회용 code 교환 방식
- 토큰 재발급 및 로그아웃
- 휴면, 정지, 탈퇴 회원 접근 제한

### 반려견 관리

- 반려견 등록, 수정, 삭제
- 반려견 이미지 업로드
- 반려견 등록번호 기반 인증
- 인증된 반려견 기준 산책 모집글 작성 가능

### 산책 메이트

- 산책 모집글 작성, 조회, 수정, 취소
- 지역, 상태, 반려견 크기, 모집 가능 여부 필터
- 산책 참여 신청, 승인, 거절, 취소
- 산책 모집 마감 및 재개
- 산책 종료 시간 기준 자동 완료 처리
- 완료된 산책 기반 신뢰도/뱃지 반영
- 검색 및 필터 조건을 유지하는 9개 단위 페이징

### 실시간 채팅

- 산책 참여 승인 후 채팅방 입장
- WebSocket/STOMP 기반 실시간 메시지 송수신
- 채팅 메시지 읽음 처리
- 채팅 알림 연동
- 차단 관계 채팅방 메시지 입력 및 전송 제한

### 케어 기록

- 산책 기록 작성
- 감정 일기 작성
- 건강 기록 작성
- 케어 기록 그래프 표시
- 주간/월간 케어 결산
- Gemini API 기반 AI 케어 분석
- AI API 실패 시 fallback 분석 제공

### 커뮤니티

- 게시글 작성, 조회, 수정, 삭제
- 게시글 이미지 첨부, 미리보기, 삭제
- 이미지 게시글 목록 썸네일 hover 미리보기
- 게시글 상세 이미지 갤러리 표시
- 일상, 잡담, 산책 후기, 케어 정보, 질문, 공지 카테고리 분류
- 조회한 게시글 사용자별 읽음 표시
- 게시글 목록 10개 단위 페이징
- 댓글 / 대댓글 및 최상위 댓글 10개 단위 페이징
- 답글을 부모 댓글과 같은 페이지에 표시
- 좋아요 기능
- 산책 후기 게시글과 실제 산책 리뷰 연결
- 사용자 미니 프로필 팝업
- 사용자 프로필 페이지

### 신고 및 차단

- 회원 신고
- 게시글 신고
- 댓글 신고
- 채팅 메시지 신고
- 사용자 차단 및 차단 해제
- 차단 관계 회원의 게시글, 댓글, 산책 모집글 노출 제한
- 차단 관계 채팅 상호작용 제한

### 알림

- 산책 신청, 승인, 거절, 취소 알림
- 채팅 메시지 알림
- 뱃지 획득 알림
- 알림 읽음 처리
- 전체 알림 ON/OFF
- 알림 유형별 세부 ON/OFF

### 신뢰도 및 뱃지

- 산책 완료, 리뷰, 신고 처리, 케어 기록 기반 신뢰도 점수 관리
- 신뢰도 이력 저장
- 조건 기반 뱃지 획득
- 첫 산책, 믿음직한 산책러, 케어 기록러, 후기 스타, 관리자 인증 뱃지

### 관리자

- 관리자 대시보드
- 회원 목록 조회 및 상태 변경
- 커뮤니티 게시글/댓글 관리
- 신고 목록 조회
- 신고 상태 및 대상 유형별 필터
- 신고 처리 상태 변경
- 신고 대상 게시글, 댓글, 채팅 메시지 삭제
- 신고 대상 회원 정지 처리
- 신고 대상이 된 관리자의 본인 신고 처리 차단

</details>

## 사전 준비 사항 (Prerequisites)

프로젝트 실행 전 아래 환경이 필요합니다.

- JDK 21 이상
- Maven 또는 Maven Wrapper
- Node.js
- npm
- MySQL
- IntelliJ IDEA 또는 VS Code

## 실행 방법 (How to Run)

### 1. Backend 설정

`be/src/main/resources/application-local.yaml` 파일에 로컬 환경 설정을 작성합니다.

```yaml
app:
  datasource:
    url: jdbc:mysql://localhost:3306/tail_tale
    username: your-db-username
    password: your-db-password

  jpa:
    ddl-auto: validate
    show-sql: true
    format-sql: true

  jwt:
    access-secret: your-access-secret
    refresh-secret: your-refresh-secret
    access-token-expiration: 3600000
    refresh-token-expiration: 1209600000

  oauth:
    google:
      client-id: your-google-client-id
      client-secret: your-google-client-secret
    kakao:
      client-id: your-kakao-client-id
      client-secret: your-kakao-client-secret
    naver:
      client-id: your-naver-client-id
      client-secret: your-naver-client-secret
```

Gemini API를 사용할 경우 아래 환경 값을 추가로 설정합니다.

```yaml
app:
  gemini:
    enabled: true
    api-key: your-gemini-api-key
    model: gemini-2.5-flash
```

### 2. Backend 실행

```bash
cd be
./mvnw spring-boot:run
```

Windows 환경에서는 아래 명령을 사용할 수 있습니다.

```bash
cd be
mvnw.cmd spring-boot:run
```

Backend 기본 접속 주소는 다음과 같습니다.

```text
http://localhost:8000
```

### 3. Frontend 실행

```bash
cd fe
npm install
npm run dev
```

Frontend 기본 접속 주소는 다음과 같습니다.

```text
http://localhost:5173
```

## API 명세 (API Reference)

<details>
<summary>클릭하여 API 명세 상세 펼치기</summary>

### 회원 / 인증

| Method | URL | Description |
| --- | --- | --- |
| POST | `/api/members/signup` | 회원가입 |
| POST | `/api/members/login` | 로컬 로그인 |
| POST | `/api/members/reissue` | accessToken 재발급 |
| POST | `/api/members/logout` | 로그아웃 |
| POST | `/api/members/oauth2/code/exchange` | OAuth2 1회용 code 교환 |
| GET | `/api/members/me` | 내 회원 정보 조회 |
| GET | `/api/members/me/dashboard` | 마이페이지 대시보드 조회 |
| PATCH | `/api/members/me` | 내 프로필 수정 |
| PATCH | `/api/members/me/profile/complete` | 추가 프로필 입력 |
| PATCH | `/api/members/me/withdraw` | 회원 탈퇴 |
| POST | `/api/members/me/password/verify` | 비밀번호 확인 |
| GET | `/api/members/{memberId}` | 회원 프로필 조회 |
| GET | `/api/members/{memberId}/mini-profile` | 회원 미니 프로필 조회 |
| POST | `/api/members/reactivate` | 휴면 계정 복구 |

### 회원 차단

| Method | URL | Description |
| --- | --- | --- |
| GET | `/api/members/blocks` | 내 차단 목록 조회 |
| POST | `/api/members/{memberId}/block` | 회원 차단 |
| DELETE | `/api/members/{memberId}/block` | 회원 차단 해제 |

### 반려견

| Method | URL | Description |
| --- | --- | --- |
| POST | `/api/dogs` | 반려견 등록 |
| GET | `/api/dogs` | 내 반려견 목록 조회 |
| GET | `/api/dogs/{dogId}` | 반려견 상세 조회 |
| PATCH | `/api/dogs/{dogId}` | 반려견 수정 |
| DELETE | `/api/dogs/{dogId}` | 반려견 삭제 |
| POST | `/api/dogs/{dogId}/verify` | 반려견 인증 |
| POST | `/api/dogs/images` | 반려견 이미지 업로드 |

### 산책 모집 / 참여 / 후기

| Method | URL | Description |
| --- | --- | --- |
| POST | `/api/walk-schedules` | 산책 모집글 작성 |
| GET | `/api/walk-schedules` | 산책 모집글 목록 조회 및 검색 (`page`, `size`, 기본 9개) |
| GET | `/api/walk-schedules/{walkScheduleId}` | 산책 모집글 상세 조회 |
| PATCH | `/api/walk-schedules/{walkScheduleId}` | 산책 모집글 수정 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/cancel` | 산책 모집글 취소 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/close` | 모집 마감 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/reopen` | 모집 재개 |
| POST | `/api/walk-schedules/{walkScheduleId}/participants` | 산책 참여 신청 |
| GET | `/api/walk-schedules/{walkScheduleId}/participants` | 산책 참여자 목록 조회 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/participants/{walkParticipantId}/approve` | 참여 승인 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/participants/{walkParticipantId}/reject` | 참여 거절 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/participants/{walkParticipantId}/cancel` | 참여 취소 |
| PATCH | `/api/walk-schedules/{walkScheduleId}/participants/me/cancel` | 내 참여 신청 취소 |
| POST | `/api/walk-schedules/{walkScheduleId}/reviews` | 산책 후기 작성 |
| GET | `/api/walk-schedules/{walkScheduleId}/reviews` | 산책 후기 목록 조회 |
| GET | `/api/walk-reviews/me/written` | 내가 작성한 산책 후기 |
| GET | `/api/walk-reviews/me/received` | 내가 받은 산책 후기 |
| PATCH | `/api/walk-reviews/{walkReviewId}` | 산책 후기 수정 |
| DELETE | `/api/walk-reviews/{walkReviewId}` | 산책 후기 삭제 |

### 채팅

| Method | URL | Description |
| --- | --- | --- |
| GET | `/api/chat/rooms` | 내 채팅방 목록 조회 |
| GET | `/api/walk-schedules/{walkScheduleId}/chat-room` | 산책 채팅방 조회 |
| GET | `/api/chat/rooms/{chatRoomId}/messages` | 채팅 메시지 조회 |
| PATCH | `/api/chat/rooms/{chatRoomId}/read` | 채팅방 읽음 처리 |

### 케어 기록

| Method | URL | Description |
| --- | --- | --- |
| POST | `/api/walk-records` | 산책 기록 작성 |
| GET | `/api/walk-records` | 산책 기록 목록 조회 |
| GET | `/api/walk-records/{walkRecordId}` | 산책 기록 상세 조회 |
| PATCH | `/api/walk-records/{walkRecordId}` | 산책 기록 수정 |
| DELETE | `/api/walk-records/{walkRecordId}` | 산책 기록 삭제 |
| GET | `/api/walk-records/summary` | 산책 기록 요약 |
| POST | `/api/emotion-diaries` | 감정 일기 작성 |
| GET | `/api/emotion-diaries` | 감정 일기 목록 조회 |
| GET | `/api/emotion-diaries/{emotionDiaryId}` | 감정 일기 상세 조회 |
| PATCH | `/api/emotion-diaries/{emotionDiaryId}` | 감정 일기 수정 |
| DELETE | `/api/emotion-diaries/{emotionDiaryId}` | 감정 일기 삭제 |
| GET | `/api/emotion-diaries/summary` | 감정 일기 요약 |
| POST | `/api/health-records` | 건강 기록 작성 |
| GET | `/api/health-records` | 건강 기록 목록 조회 |
| GET | `/api/health-records/{healthRecordId}` | 건강 기록 상세 조회 |
| PATCH | `/api/health-records/{healthRecordId}` | 건강 기록 수정 |
| DELETE | `/api/health-records/{healthRecordId}` | 건강 기록 삭제 |
| GET | `/api/health-records/summary` | 건강 기록 요약 |
| POST | `/api/care/analyses` | AI 케어 분석 생성 |
| GET | `/api/care/analyses` | AI 케어 분석 목록 조회 |
| GET | `/api/care/analyses/{aiAnalysisResultId}` | AI 케어 분석 상세 조회 |
| GET | `/api/care/summary` | 케어 통합 요약 |

### 커뮤니티

| Method | URL | Description |
| --- | --- | --- |
| POST | `/api/community/posts` | 게시글 작성 |
| POST | `/api/community/posts/images` | 게시글 이미지 업로드 |
| GET | `/api/community/posts` | 게시글 목록 조회 및 검색 (`page`, `size`, 기본 10개) |
| GET | `/api/community/posts/{communityPostId}` | 게시글 상세 조회 |
| PATCH | `/api/community/posts/{communityPostId}` | 게시글 수정 |
| DELETE | `/api/community/posts/{communityPostId}` | 게시글 삭제 |
| POST | `/api/community/posts/{communityPostId}/likes` | 게시글 좋아요 토글 |
| POST | `/api/community/posts/{communityPostId}/comments` | 댓글 작성 |
| GET | `/api/community/posts/{communityPostId}/comments` | 최상위 댓글 기준 목록 조회 (`page`, `size`, 기본 10개) |
| PATCH | `/api/community/posts/{communityPostId}/comments/{commentId}` | 댓글 수정 |
| DELETE | `/api/community/posts/{communityPostId}/comments/{commentId}` | 댓글 삭제 |

### 알림 / 신고 / 관리자

| Method | URL | Description |
| --- | --- | --- |
| GET | `/api/notifications` | 내 알림 목록 조회 |
| GET | `/api/notifications/settings` | 내 알림 설정 조회 |
| PATCH | `/api/notifications/settings/{notificationType}` | 알림 설정 변경 |
| PATCH | `/api/notifications/{notificationId}/read` | 알림 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 전체 알림 읽음 처리 |
| PATCH | `/api/notifications/targets/{targetType}/{targetId}/read` | 특정 대상 알림 일괄 읽음 처리 |
| POST | `/api/reports` | 신고 등록 |
| GET | `/api/admin/dashboard` | 관리자 대시보드 |
| GET | `/api/admin/members` | 관리자 회원 목록 |
| PATCH | `/api/admin/members/{memberId}/status` | 회원 상태 변경 |
| GET | `/api/admin/reports` | 신고 목록 조회 |
| PATCH | `/api/admin/reports/{reportId}` | 신고 처리 |
| GET | `/api/admin/community/posts` | 관리자 게시글 목록 |
| DELETE | `/api/admin/community/posts/{communityPostId}` | 관리자 게시글 삭제 |
| GET | `/api/admin/community/comments` | 관리자 댓글 목록 |
| DELETE | `/api/admin/community/comments/{commentId}` | 관리자 댓글 삭제 |

</details>

## 페이지 라우팅

<details>
<summary>클릭하여 페이지 라우팅 상세 펼치기</summary>

| Path | Page |
| --- | --- |
| `/` | 메인 페이지 |
| `/oauth2/redirect` | OAuth2 code 처리 페이지 |
| `/oauth2/profile-complete` | OAuth2 추가 정보 입력 |
| `/profile-complete` | 마이페이지 |
| `/dogs` | 반려견 관리 |
| `/walks` | 산책 모집 목록 |
| `/walks/new` | 산책 모집글 작성 |
| `/walks/:walkScheduleId` | 산책 모집 상세 |
| `/chat/rooms` | 채팅방 목록 |
| `/chat/rooms/:chatRoomId` | 채팅방 상세 |
| `/care` | 케어 기록 |
| `/community` | 커뮤니티 목록 |
| `/community/write` | 커뮤니티 글쓰기 |
| `/community/:communityPostId` | 커뮤니티 상세 |
| `/community/:communityPostId/edit` | 커뮤니티 수정 |
| `/members/:memberId` | 사용자 프로필 |
| `/admin` | 관리자 페이지 |

</details>

## 사용 기술

| Category | Tech |
| --- | --- |
| Language | Java 21, JavaScript |
| Backend | Spring Boot 4.0.6, Spring Security, Spring Web MVC |
| Auth | JWT, OAuth2 Client, httpOnly Cookie |
| ORM | Spring Data JPA, Hibernate, QueryDSL 5.1.0 |
| Database | MySQL |
| Realtime | WebSocket, STOMP |
| AI | Gemini API |
| Frontend | React 19.2.6, Vite 8, Axios 1.17 |
| Styling | Tailwind CSS 4 |
| Build Tool | Maven, npm |
| Library | Lombok, jjwt, React Markdown |

## 주요 엔티티

| Entity | Description |
| --- | --- |
| Member | 회원 정보, 권한, 상태, 프로필, OAuth2 계정 연결 |
| RefreshToken | refreshToken 해시, 만료, 폐기 상태 관리 |
| OAuth2AuthCode | OAuth2 로그인 후 1회용 code 교환 관리 |
| Dog | 반려견 정보, 이미지, 인증 여부 관리 |
| WalkSchedule | 산책 모집글, 일정, 지역, 모집 상태 관리 |
| WalkParticipant | 산책 참여 신청, 승인, 거절, 취소 상태 관리 |
| WalkReview | 산책 후기, 평점, 리뷰 대상 관리 |
| ChatRoom | 산책별 채팅방 관리 |
| ChatMessage | 채팅 메시지 및 시스템 메시지 관리 |
| CommunityPost | 커뮤니티 게시글, 카테고리, 조회수, 좋아요, 댓글 수 관리 |
| CommunityPostImage | 커뮤니티 게시글 첨부 이미지, 대표 썸네일, 표시 순서 관리 |
| CommunityComment | 댓글, 대댓글, 삭제 상태 관리 |
| WalkRecord | 산책 기록, 거리, 시간, 산책 후 컨디션 관리 |
| EmotionDiary | 감정 일기 및 산책 기록 연결 관리 |
| HealthRecord | 몸무게, 건강 상태, 증상, 메모 관리 |
| AiAnalysisResult | AI 케어 분석 결과 저장 |
| Notification | 알림 내용, 읽음 상태, 대상 타입 관리 |
| NotificationSetting | 알림 유형별 ON/OFF 설정 관리 |
| Report | 신고 대상, 신고 사유, 처리 상태 관리 |
| MemberBlock | 회원 차단 및 차단 해제 상태 관리 |
| TrustScoreHistory | 신뢰도 점수 변동 이력 관리 |
| Badge | Java Enum 기반 뱃지 코드와 이름, 설명, 획득 조건 관리 |
| MemberBadge | 회원별 획득 뱃지 관리 |

## 보안 및 정책

- accessToken은 응답 body로 전달합니다.
- refreshToken은 httpOnly Cookie로 저장합니다.
- OAuth2 로그인은 URL에 토큰을 노출하지 않고 1회용 code 교환 방식으로 처리합니다.
- refreshToken은 DB에 해시로 저장하고 재발급 시 기존 토큰을 폐기합니다.
- 로그아웃 시 refreshToken 폐기 및 Cookie 만료 처리를 수행합니다.
- 차단 관계에서는 게시글, 댓글, 산책 모집글, 채팅 상호작용을 제한합니다.
- 신고 처리 결과에 따라 콘텐츠 삭제 및 회원 정지 처리가 가능합니다.
- 신고 대상이 된 관리자는 본인의 신고 건을 직접 처리할 수 없습니다.
- 조회한 게시글 기록은 accessToken의 회원 ID를 기준으로 브라우저에 분리 저장합니다.

## 기타

- `application.yaml`은 공통 설정을 담당합니다.
- `application-local.yaml`은 로컬 DB, JWT Secret, OAuth2 Client, Gemini API Key 정보를 담당합니다.
- 민감 정보는 Git에 노출하지 않도록 별도 관리하는 것을 권장합니다.
- `docs/sql/tail_tale_full.sql`은 전체 DB 스키마를 관리합니다.
- `docs/sql/tail_tale_care_seed.sql`은 케어 기록 비교, 페이징, 댓글/답글, 신고 관리 확인용 seed 데이터를 포함합니다.
