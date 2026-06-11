package com.tailandtale.global.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

// JWT 생성 및 검증을 담당하는 Provider

@Component
public class JwtProvider {
    private final SecretKey accessSecretKey;
    private final SecretKey refreshSecretKey;

    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtProvider(
            @Value("${jwt.access-secret}") String accessSecret,
            @Value("${jwt.refresh-secret}") String refreshSecret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration
    ) {
        this.accessSecretKey = Keys.hmacShaKeyFor(accessSecret.getBytes());
        this.refreshSecretKey = Keys.hmacShaKeyFor(refreshSecret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // Access Token 생성
    public String createAccessToken(Long memberId) {
        return createToken(memberId, accessTokenExpiration, accessSecretKey);
    }

    // Refresh Token 생성
    public String createRefreshToken(Long memberId) {
        return createToken(memberId, refreshTokenExpiration, refreshSecretKey);
    }

    // JWT 생성
    private String createToken(Long memberId, long expiration, SecretKey secretKey) {
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration * 1000))
                .signWith(secretKey)
                .compact();
    }


    // Access Token 검증
    public boolean validateAccessToken(String token) {
        return validateToken(token, accessSecretKey);
    }

    // Refresh Token 검증
    public boolean validateRefreshToken(String token) {
        return validateToken(token, refreshSecretKey);
    }

    // JWT 검증 공통 메서드
    private boolean validateToken(String token, SecretKey secretKey) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Access Token에서 memberId 추출
    public Long getMemberIdFromAccessToken(String token) {
        return getMemberId(token, accessSecretKey);
    }

    // Refresh Token에서 memberId 추출
    public Long getMemberIdFromRefreshToken(String token) {
        return getMemberId(token, refreshSecretKey);
    }

    // Refresh Token 만료 시간 조회
    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }

    // memberId 추출 공통 메서드
    private Long getMemberId(String token, SecretKey secretKey) {
        return Long.valueOf(
                Jwts.parser()
                        .verifyWith(secretKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload()
                        .getSubject()
        );
    }
}