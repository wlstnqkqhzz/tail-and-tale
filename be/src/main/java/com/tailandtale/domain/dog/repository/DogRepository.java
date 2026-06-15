package com.tailandtale.domain.dog.repository;

import com.tailandtale.domain.dog.entity.Dog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 반려견 Repository

public interface DogRepository extends JpaRepository<Dog, Long> {
    // 회원의 반려견 목록 조회
    List<Dog> findAllByMemberId(Long memberId);

    // 회원의 특정 반려견 조회
    Optional<Dog> findByIdAndMemberId(Long dogId, Long memberId);
}