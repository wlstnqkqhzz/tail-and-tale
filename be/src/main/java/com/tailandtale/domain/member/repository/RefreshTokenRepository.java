package com.tailandtale.domain.member.repository;

// Refresh Token Repository

import com.tailandtale.domain.member.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // Refresh Token 조회
    Optional<RefreshToken> findByToken(String token);

    // 회원 Refresh Token 전체 폐기
    @Modifying(clearAutomatically = true)
    @Query("""
            update RefreshToken rt
            set rt.revokedAt = :revokedAt
            where rt.member.id = :memberId
              and rt.revokedAt is null
            """)
    void revokeAllByMemberId(
            @Param("memberId") Long memberId,
            @Param("revokedAt") LocalDateTime revokedAt
    );
}
