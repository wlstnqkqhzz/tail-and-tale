package com.tailandtale.domain.member.repository;

// Refresh Token Repository

import com.tailandtale.domain.member.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // Refresh Token 조회
    Optional<RefreshToken> findByToken(String token);
}