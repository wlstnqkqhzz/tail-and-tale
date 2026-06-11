package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.OAuthAccount;
import com.tailandtale.domain.member.entity.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// OAuth 계정 Repository

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {
    // OAuth 계정 조회
    Optional<OAuthAccount> findByProviderAndProviderUserId(
            OAuthProvider provider,
            String providerUserId
    );
}
