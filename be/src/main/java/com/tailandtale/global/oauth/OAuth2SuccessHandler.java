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
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

// OAuth2 로그인 성공 후 처리

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final String FRONTEND_BASE_URL = "http://localhost:5173";

    private final MemberRepository memberRepository;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String providerUserId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String profileImageUrl = oAuth2User.getAttribute("picture");

        Member member = oAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.GOOGLE, providerUserId)
                .map(OAuthAccount::getMember)
                .orElseGet(() -> createOrLinkGoogleMember(providerUserId, email, profileImageUrl));

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

        String redirectPath = member.getStatus() == MemberStatus.PENDING
                ? "/profile/complete"
                : "/login/success";

        response.sendRedirect(
                FRONTEND_BASE_URL + redirectPath
                        + "?access=" + encode(accessToken)
                        + "&refresh=" + encode(refreshToken)
                        + "&status=" + member.getStatus().name()
        );
    }

    private Member createOrLinkGoogleMember(String providerUserId, String email, String profileImageUrl) {
        Member member = memberRepository.findByEmail(email)
                .orElseGet(() -> memberRepository.save(
                        Member.builder()
                                .email(email)
                                .realName("PENDING")
                                .nickname(createPendingNickname(providerUserId))
                                .profileImageUrl(profileImageUrl)
                                .status(MemberStatus.PENDING)
                                .build()
                ));

        oAuthAccountRepository.save(
                OAuthAccount.builder()
                        .member(member)
                        .provider(OAuthProvider.GOOGLE)
                        .providerUserId(providerUserId)
                        .providerEmail(email)
                        .build()
        );

        return member;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String createPendingNickname(String providerUserId) {
        String suffix = providerUserId.length() > 23
                ? providerUserId.substring(0, 23)
                : providerUserId;

        return "google_" + suffix;
    }
}
