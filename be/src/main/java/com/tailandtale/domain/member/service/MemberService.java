package com.tailandtale.domain.member.service;

import com.tailandtale.domain.care.service.AiAnalysisService;
import com.tailandtale.domain.care.service.EmotionDiaryService;
import com.tailandtale.domain.care.service.HealthRecordService;
import com.tailandtale.domain.care.service.WalkRecordService;
import com.tailandtale.domain.chat.service.ChatService;
import com.tailandtale.domain.community.service.CommunityCommentService;
import com.tailandtale.domain.community.service.CommunityPostService;
import com.tailandtale.domain.dog.dto.DogDto;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.dto.LoginFormDto;
import com.tailandtale.domain.member.dto.MemberDto;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberStatus;
import com.tailandtale.domain.member.entity.OAuth2AuthCode;
import com.tailandtale.domain.member.entity.RefreshToken;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.repository.OAuth2AuthCodeRepository;
import com.tailandtale.domain.member.repository.RefreshTokenRepository;
import com.tailandtale.domain.walk.dto.WalkScheduleDto;
import com.tailandtale.domain.walk.entity.WalkParticipantStatus;
import com.tailandtale.domain.walk.entity.WalkSchedule;
import com.tailandtale.domain.walk.repository.WalkParticipantRepository;
import com.tailandtale.domain.walk.service.WalkReviewService;
import com.tailandtale.domain.walk.repository.WalkScheduleRepository;
import com.tailandtale.global.exception.AuthErrorCode;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberErrorCode;
import com.tailandtale.global.jwt.JwtProvider;
import com.tailandtale.global.security.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// 회원 정보 CRUD 및 인증 관련 비즈니스 로직 서비스

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {
    private static final int DORMANT_MONTHS = 6;

    private final MemberRepository memberRepository;
    private final DogRepository dogRepository;
    private final WalkScheduleRepository walkScheduleRepository;
    private final WalkParticipantRepository walkParticipantRepository;
    private final ChatService chatService;
    private final WalkReviewService walkReviewService;
    private final WalkRecordService walkRecordService;
    private final EmotionDiaryService emotionDiaryService;
    private final HealthRecordService healthRecordService;
    private final AiAnalysisService aiAnalysisService;
    private final CommunityPostService communityPostService;
    private final CommunityCommentService communityCommentService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuth2AuthCodeRepository oAuth2AuthCodeRepository;

    // Refresh Token 만료 시간 조회
    public long getRefreshTokenExpiration() {
        return jwtProvider.getRefreshTokenExpiration();
    }

    // 로그인
    @Transactional(noRollbackFor = CustomException.class)
    public LoginFormDto.TokenResponse login(LoginFormDto.LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail()).orElseThrow(() -> new CustomException(AuthErrorCode.LOGIN_FAILED));

        if (member.getPassword() == null || !passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        validateLoginAllowed(member);
        member.recordLogin();

        String accessToken = jwtProvider.createAccessToken(member.getId());
        String refreshToken = issueRefreshToken(member, null, null, null);

        return LoginFormDto.TokenResponse.builder()
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // 회원가입
    @Transactional
    public void signup(MemberDto.SignupRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(MemberErrorCode.DUPLICATE_EMAIL);
        }

        if (memberRepository.existsByNickname(request.getNickname())) {
            throw new CustomException(MemberErrorCode.DUPLICATE_NICKNAME);
        }

        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .realName(request.getRealName())
                .nickname(request.getNickname())
                .phoneNumber(request.getPhoneNumber())
                .region(request.getRegion())
                .introduction(request.getIntroduction())
                .build();

        memberRepository.save(member);
    }

    // 회원 상세 조회
    public MemberDto.DetailResponse getMember(Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        return MemberDto.DetailResponse.from(member);
    }

    // 회원 미니 프로필 조회
    public MemberDto.MiniProfileResponse getMiniProfile(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        return MemberDto.MiniProfileResponse.from(
                member,
                dogRepository.findAllByMemberId(memberId)
                        .stream()
                        .filter(dog -> Boolean.TRUE.equals(dog.getIsVerified()))
                        .findFirst()
                        .map(dog -> dog.getSize())
                        .orElse(null),
                walkParticipantRepository.countByMemberIdAndStatus(memberId, WalkParticipantStatus.APPROVED)
        );
    }

    // 내 정보 수정
    @Transactional
    public MemberDto.DetailResponse updateMyProfile(Long memberId, MemberDto.UpdateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        memberRepository.findByNickname(request.getNickname())
                .filter(foundMember -> !foundMember.getId().equals(memberId))
                .ifPresent(foundMember -> {
                    throw new CustomException(MemberErrorCode.DUPLICATE_NICKNAME);
                });

        member.updateProfile(
                request.getNickname(),
                request.getPhoneNumber(),
                request.getRegion(),
                request.getIntroduction()
        );

        return MemberDto.DetailResponse.from(member);
    }

    // 내 비밀번호 확인
    public void verifyMyPassword(Long memberId, MemberDto.PasswordConfirmRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        validatePassword(member, request.getPassword());
    }

    // 회원 탈퇴
    @Transactional
    public void withdraw(Long memberId, MemberDto.PasswordConfirmRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        validatePassword(member, request.getPassword());
        member.withdraw();
        refreshTokenRepository.revokeAllByMemberId(memberId, LocalDateTime.now());
    }

    // 마이페이지 대시보드 조회
    public MemberDto.DashboardResponse getMyDashboard(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        return MemberDto.DashboardResponse.builder()
                .member(MemberDto.DetailResponse.from(member))
                .dogs(dogRepository.findAllByMemberId(memberId)
                        .stream()
                        .map(DogDto.DetailResponse::from)
                        .toList())
                .myWalkSchedules(walkScheduleRepository.findAllByHostMemberIdOrderByCreatedAtDesc(memberId)
                        .stream()
                        .map(walkSchedule -> toWalkScheduleResponse(walkSchedule, memberId))
                        .toList())
                .myParticipations(walkParticipantRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                        .stream()
                        .map(walkParticipant -> MemberDto.ParticipationResponse.from(
                                walkParticipant,
                                getApprovedCount(walkParticipant.getWalkSchedule().getId())
                        ))
                        .toList())
                .chatRooms(chatService.getMyChatRooms(memberId))
                .writtenReviews(walkReviewService.getRecentWrittenReviews(memberId))
                .receivedReviews(walkReviewService.getRecentReceivedReviews(memberId))
                .walkRecords(walkRecordService.getRecentWalkRecords(memberId))
                .emotionDiaries(emotionDiaryService.getRecentEmotionDiaries(memberId))
                .healthRecords(healthRecordService.getRecentHealthRecords(memberId))
                .aiAnalyses(aiAnalysisService.getRecentAnalyses(memberId))
                .communityPosts(communityPostService.getRecentMyPosts(memberId))
                .communityComments(communityCommentService.getRecentMyComments(memberId))
                .build();
    }

    // OAuth 추가 정보 입력 완료
    @Transactional
    public MemberDto.DetailResponse completeProfile(Long memberId, MemberDto.CompleteProfileRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        memberRepository.findByNickname(request.getNickname())
                .filter(foundMember -> !foundMember.getId().equals(memberId))
                .ifPresent(foundMember -> {
                    throw new CustomException(MemberErrorCode.DUPLICATE_NICKNAME);
                });

        member.completeProfile(
                request.getRealName(),
                request.getNickname(),
                request.getPhoneNumber(),
                request.getRegion(),
                request.getIntroduction()
        );

        return MemberDto.DetailResponse.from(member);
    }

    // Refresh Token 재발급
    @Transactional(noRollbackFor = CustomException.class)
    public LoginFormDto.TokenResponse reissue(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        if (!jwtProvider.validateRefreshToken(refreshToken)) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        Long memberId = jwtProvider.getMemberIdFromRefreshToken(refreshToken);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        validateLoginAllowed(member);

        RefreshToken savedRefreshToken = refreshTokenRepository.findByTokenHash(TokenHashUtil.sha256(refreshToken))
                .orElseThrow(() -> new CustomException(AuthErrorCode.LOGIN_FAILED));

        // 토큰 소유 회원 검증
        if (!savedRefreshToken.getMember().getId().equals(memberId)) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        if (savedRefreshToken.getRevokedAt() != null
                || !savedRefreshToken.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        String newAccessToken = jwtProvider.createAccessToken(memberId);

        savedRefreshToken.revoke();
        String newRefreshToken = issueRefreshToken(
                member,
                savedRefreshToken.getDeviceId(),
                savedRefreshToken.getUserAgent(),
                savedRefreshToken.getIpAddress()
        );

        return LoginFormDto.TokenResponse.builder()
                .grantType("Bearer")
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    // 휴면 계정 재활성화
    @Transactional
    public void reactivateDormantAccount(LoginFormDto.LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(AuthErrorCode.LOGIN_FAILED));

        validatePassword(member, request.getPassword());

        if (member.getStatus() != MemberStatus.INACTIVE
                && !(member.getStatus() == MemberStatus.ACTIVE && isDormantTarget(member))) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        member.reactivateDormantAccount();
    }

    // 로그아웃
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        if (!jwtProvider.validateRefreshToken(refreshToken)) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        RefreshToken savedRefreshToken = refreshTokenRepository.findByTokenHash(TokenHashUtil.sha256(refreshToken))
                .orElseThrow(() -> new CustomException(AuthErrorCode.LOGIN_FAILED));

        if (savedRefreshToken.getRevokedAt() != null) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        savedRefreshToken.revoke();
    }

    // OAuth2 인증 코드 교환
    @Transactional(noRollbackFor = CustomException.class)
    public LoginFormDto.TokenResponse exchangeOAuth2Code(LoginFormDto.OAuth2CodeExchangeRequest request) {
        OAuth2AuthCode authCode = oAuth2AuthCodeRepository.findByCodeHash(TokenHashUtil.sha256(request.getCode()))
                .orElseThrow(() -> new CustomException(AuthErrorCode.LOGIN_FAILED));

        if (!authCode.isUsable(LocalDateTime.now())) {
            throw new CustomException(AuthErrorCode.LOGIN_FAILED);
        }

        Member member = authCode.getMember();
        validateLoginAllowed(member);
        authCode.use();

        String accessToken = jwtProvider.createAccessToken(member.getId());
        String refreshToken = issueRefreshToken(
                member,
                null,
                authCode.getUserAgent(),
                authCode.getIpAddress()
        );

        return LoginFormDto.TokenResponse.builder()
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // 산책 일정 응답 생성
    private WalkScheduleDto.DetailResponse toWalkScheduleResponse(WalkSchedule walkSchedule, Long memberId) {
        long approvedParticipantCount = getApprovedCount(walkSchedule.getId());
        long pendingRequestCount = walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkSchedule.getId(),
                WalkParticipantStatus.REQUESTED
        );
        WalkParticipantStatus myParticipantStatus = walkParticipantRepository.findFirstByWalkScheduleIdAndMemberIdOrderByCreatedAtDesc(
                        walkSchedule.getId(),
                        memberId
                )
                .map(walkParticipant -> walkParticipant.getStatus())
                .orElse(null);

        return WalkScheduleDto.DetailResponse.from(
                walkSchedule,
                approvedParticipantCount,
                pendingRequestCount,
                myParticipantStatus
        );
    }

    // 승인된 참여자 수 조회
    private long getApprovedCount(Long walkScheduleId) {
        return walkParticipantRepository.countByWalkScheduleIdAndStatus(
                walkScheduleId,
                WalkParticipantStatus.APPROVED
        );
    }

    // 회원 상태별 로그인 및 토큰 재발급 차단
    private void validateLoginAllowed(Member member) {
        if (member.getStatus() == MemberStatus.ACTIVE && isDormantTarget(member)) {
            member.deactivate();
            throw new CustomException(AuthErrorCode.ACCOUNT_INACTIVE);
        }

        if (member.getStatus() == MemberStatus.INACTIVE) {
            throw new CustomException(AuthErrorCode.ACCOUNT_INACTIVE);
        }

        if (member.getStatus() == MemberStatus.BANNED) {
            throw new CustomException(AuthErrorCode.ACCOUNT_BANNED);
        }

        if (member.getStatus() == MemberStatus.DELETED) {
            throw new CustomException(AuthErrorCode.ACCOUNT_DELETED);
        }
    }

    // 휴면 전환 대상 여부 확인
    private boolean isDormantTarget(Member member) {
        LocalDateTime baseDateTime = member.getLastLoginAt() != null
                ? member.getLastLoginAt()
                : member.getCreatedAt();

        return baseDateTime != null
                && baseDateTime.isBefore(LocalDateTime.now().minusMonths(DORMANT_MONTHS));
    }

    // 비밀번호 검증
    private void validatePassword(Member member, String password) {
        if (member.getPassword() == null || !passwordEncoder.matches(password, member.getPassword())) {
            throw new CustomException(AuthErrorCode.INVALID_PASSWORD);
        }
    }

    // Refresh Token 발급 및 저장
    private String issueRefreshToken(
            Member member,
            String deviceId,
            String userAgent,
            String ipAddress
    ) {
        String refreshToken = jwtProvider.createRefreshToken(member.getId());

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .member(member)
                        .tokenHash(TokenHashUtil.sha256(refreshToken))
                        .deviceId(deviceId)
                        .userAgent(userAgent)
                        .ipAddress(ipAddress)
                        .expiresAt(LocalDateTime.now().plusSeconds(jwtProvider.getRefreshTokenExpiration()))
                        .build()
        );

        return refreshToken;
    }
}
