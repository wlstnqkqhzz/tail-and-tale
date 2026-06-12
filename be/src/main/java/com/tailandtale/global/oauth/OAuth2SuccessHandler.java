package com.tailandtale.global.oauth;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberStatus;
import com.tailandtale.domain.member.entity.OAuthAccount;
import com.tailandtale.domain.member.entity.OAuthProvider;
import com.tailandtale.domain.member.entity.RefreshToken;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.domain.member.repository.OAuthAccountRepository;
import com.tailandtale.domain.member.repository.RefreshTokenRepository;
import com.tailandtale.global.jwt.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

// OAuth2 로그인 성공 Handler

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    @Value("${app.frontend-url}")
    private String frontendBaseUrl;

    // =========================
    // Repository 및 Provider
    // =========================

    private final MemberRepository memberRepository;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    // =========================
    // OAuth 로그인 성공 처리
    // =========================

    // OAuth 로그인 성공 처리
    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oAuth2AuthenticationToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oAuth2AuthenticationToken.getPrincipal();

        OAuthProvider provider = OAuthProvider.valueOf(
                oAuth2AuthenticationToken.getAuthorizedClientRegistrationId().toUpperCase(Locale.ROOT)
        );
        OAuth2MemberInfo memberInfo = extractMemberInfo(provider, oAuth2User.getAttributes());

        Member member = oAuthAccountRepository.findByProviderAndProviderUserId(provider, memberInfo.providerUserId())
                .map(OAuthAccount::getMember)
                .orElseGet(() -> createOrLinkOAuthMember(provider, memberInfo));

        String accessToken = jwtProvider.createAccessToken(member.getId());
        String refreshToken = jwtProvider.createRefreshToken(member.getId());

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .member(member)
                        .token(refreshToken)
                        .deviceId(null)
                        .userAgent(request.getHeader("User-Agent"))
                        .ipAddress(request.getRemoteAddr())
                        .expiresAt(LocalDateTime.now().plusSeconds(jwtProvider.getRefreshTokenExpiration()))
                        .build()
        );

        String redirectPath = "/oauth2/redirect";

        response.sendRedirect(
                frontendBaseUrl + redirectPath
                        + "?accessToken=" + encode(accessToken)
                        + "&refreshToken=" + encode(refreshToken)
                        + "&status=" + member.getStatus().name()
                        + "&provider=" + provider.name()
        );
    }

    // =========================
    // OAuth 회원 처리
    // =========================

    // OAuth 회원 조회 및 생성
    private Member createOrLinkOAuthMember(OAuthProvider provider, OAuth2MemberInfo memberInfo) {
        String email = resolveEmail(provider, memberInfo.providerUserId(), memberInfo.email());

        Member member = memberRepository.findByEmail(email)
                .orElseGet(() -> memberRepository.save(
                        Member.builder()
                                .email(email)
                                .realName(resolvePendingRealName(memberInfo.realName()))
                                .nickname(resolvePendingNickname(provider, memberInfo.providerUserId(), memberInfo.nickname()))
                                .profileImageUrl(memberInfo.profileImageUrl())
                                .status(MemberStatus.PENDING)
                                .build()
                ));

        oAuthAccountRepository.save(
                OAuthAccount.builder()
                        .member(member)
                        .provider(provider)
                        .providerUserId(memberInfo.providerUserId())
                        .providerEmail(email)
                        .build()
        );

        return member;
    }

    // =========================
    // Provider별 정보 추출
    // =========================

    // OAuth 회원 정보 추출
    private OAuth2MemberInfo extractMemberInfo(OAuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> extractGoogleMemberInfo(attributes);
            case KAKAO -> extractKakaoMemberInfo(attributes);
            case NAVER -> extractNaverMemberInfo(attributes);
        };
    }

    // Google 회원 정보 추출
    private OAuth2MemberInfo extractGoogleMemberInfo(Map<String, Object> attributes) {
        return new OAuth2MemberInfo(
                value(attributes.get("sub")),
                value(attributes.get("email")),
                value(attributes.get("picture")),
                null,
                null
        );
    }

    // Kakao 회원 정보 추출
    @SuppressWarnings("unchecked")
    private OAuth2MemberInfo extractKakaoMemberInfo(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profile = kakaoAccount != null
                ? (Map<String, Object>) kakaoAccount.get("profile")
                : null;

        return new OAuth2MemberInfo(
                value(attributes.get("id")),
                kakaoAccount != null ? value(kakaoAccount.get("email")) : null,
                profile != null ? value(profile.get("profile_image_url")) : null,
                null,
                profile != null ? value(profile.get("nickname")) : null
        );
    }

    // Naver 회원 정보 추출
    @SuppressWarnings("unchecked")
    private OAuth2MemberInfo extractNaverMemberInfo(Map<String, Object> attributes) {
        Map<String, Object> response = (Map<String, Object>) attributes.get("response");

        return new OAuth2MemberInfo(
                response != null ? value(response.get("id")) : null,
                response != null ? value(response.get("email")) : null,
                response != null ? value(response.get("profile_image")) : null,
                response != null ? value(response.get("name")) : null,
                null
        );
    }

    // =========================
    // 유틸 메서드
    // =========================

    // 이메일 보정
    private String resolveEmail(OAuthProvider provider, String providerUserId, String email) {
        if (email != null && !email.isBlank()) {
            return email;
        }

        return provider.name().toLowerCase(Locale.ROOT) + "_" + providerUserId + "@oauth.local";
    }

    // URL 인코딩
    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // 임시 실명 생성
    private String resolvePendingRealName(String realName) {
        if (realName != null && !realName.isBlank()) {
            return realName;
        }

        return "PENDING";
    }

    // 임시 닉네임 생성
    private String resolvePendingNickname(OAuthProvider provider, String providerUserId, String nickname) {
        if (nickname != null && !nickname.isBlank() && !memberRepository.existsByNickname(nickname)) {
            return nickname;
        }

        return createPendingNickname(provider, providerUserId);
    }

    // 임시 닉네임 생성
    private String createPendingNickname(OAuthProvider provider, String providerUserId) {
        String prefix = provider.name().toLowerCase(Locale.ROOT);
        int maxSuffixLength = 30 - prefix.length() - 1;
        String suffix = providerUserId.length() > maxSuffixLength
                ? providerUserId.substring(0, maxSuffixLength)
                : providerUserId;

        return prefix + "_" + suffix;
    }

    // 문자열 변환
    private String value(Object value) {
        return value != null ? String.valueOf(value) : null;
    }

    // OAuth 회원 정보
    private record OAuth2MemberInfo(
            String providerUserId,
            String email,
            String profileImageUrl,
            String realName,
            String nickname
    ) {
    }
}
