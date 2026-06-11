package com.tailandtale.domain.member.repository;

// 회원 Repository

import com.tailandtale.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    // 이메일 조회
    Optional<Member> findByEmail(String email);

    // 닉네임 조회
    Optional<Member> findByNickname(String nickname);

    // 이메일 중복 체크
    boolean existsByEmail(String email);

    // 닉네임 중복 체크
    boolean existsByNickname(String nickname);
}