package com.tailandtale.global.oauth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.SerializationUtils;

import java.time.Duration;
import java.util.Base64;

// OAuth2 인증 요청을 세션 대신 쿠키에 저장

@Component
public class CookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    private static final String AUTHORIZATION_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    private static final Duration COOKIE_EXPIRE_TIME = Duration.ofMinutes(3);

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return getCookie(request);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            deleteCookie(response);
            return;
        }

        String cookieValue = Base64.getUrlEncoder()
                .encodeToString(SerializationUtils.serialize(authorizationRequest));

        ResponseCookie cookie = ResponseCookie.from(AUTHORIZATION_REQUEST_COOKIE_NAME, cookieValue)
                .httpOnly(true)
                .path("/")
                .maxAge(COOKIE_EXPIRE_TIME)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        OAuth2AuthorizationRequest authorizationRequest = loadAuthorizationRequest(request);
        deleteCookie(response);

        return authorizationRequest;
    }

    private OAuth2AuthorizationRequest getCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        for (Cookie cookie : request.getCookies()) {
            if (AUTHORIZATION_REQUEST_COOKIE_NAME.equals(cookie.getName())) {
                byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());

                return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(bytes);
            }
        }

        return null;
    }

    private void deleteCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(AUTHORIZATION_REQUEST_COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
