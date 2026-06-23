package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.OAuth2AuthCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// OAuth2 인증 코드 Repository

@Repository
public interface OAuth2AuthCodeRepository extends JpaRepository<OAuth2AuthCode, Long> {
    // OAuth2 인증 코드 해시 조회
    Optional<OAuth2AuthCode> findByCodeHash(String codeHash);
}
