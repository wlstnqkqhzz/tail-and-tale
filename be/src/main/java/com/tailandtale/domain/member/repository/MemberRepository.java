package com.tailandtale.domain.member.repository;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// 회원 Repository

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

    // 회원 상태별 개수 조회
    long countByStatus(MemberStatus status);

    // 관리자 회원 검색
    @Query("""
            select m
            from Member m
            where (:status is null or m.status = :status)
              and (
                    :keyword is null
                    or lower(m.email) like lower(concat('%', :keyword, '%'))
                    or lower(m.nickname) like lower(concat('%', :keyword, '%'))
                    or lower(m.realName) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<Member> searchForAdmin(
            @Param("status") MemberStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
