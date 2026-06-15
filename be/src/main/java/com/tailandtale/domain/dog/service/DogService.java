package com.tailandtale.domain.dog.service;

import com.tailandtale.domain.dog.dto.DogDto;
import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.repository.DogRepository;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.global.animal.AnimalRegistrationClient;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 반려견 정보 CRUD 비즈니스 로직 서비스

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DogService {
    private final DogRepository dogRepository;
    private final MemberRepository memberRepository;
    private final AnimalRegistrationClient animalRegistrationClient;

    // 반려견 등록
    @Transactional
    public DogDto.DetailResponse registerDog(Long memberId, DogDto.RegisterRequest request) {

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));

        Dog dog = Dog.create(
                member,
                request.getName(),
                request.getBreed(),
                request.getGender(),
                request.getBirthDate(),
                request.getWeight(),
                request.getSize(),
                request.getPersonality(),
                request.getProfileImageUrl(),
                request.getIsNeutered(),
                request.getNote()
        );

        Dog savedDog = dogRepository.save(dog);

        return DogDto.DetailResponse.from(savedDog);
    }

    // 내 반려견 목록 조회
    public List<DogDto.DetailResponse> getMyDogs(Long memberId) {
        return dogRepository.findAllByMemberId(memberId)
                .stream()
                .map(DogDto.DetailResponse::from)
                .toList();
    }

    // 내 반려견 상세 조회
    public DogDto.DetailResponse getMyDog(Long memberId, Long dogId) {
        Dog dog = getDogByMember(memberId, dogId);

        return DogDto.DetailResponse.from(dog);
    }

    // 반려견 정보 수정
    @Transactional
    public DogDto.DetailResponse updateDog(Long memberId, Long dogId, DogDto.UpdateRequest request) {
        Dog dog = getDogByMember(memberId, dogId);

        dog.update(
                request.getName(),
                request.getBreed(),
                request.getGender(),
                request.getBirthDate(),
                request.getWeight(),
                request.getSize(),
                request.getPersonality(),
                request.getProfileImageUrl(),
                request.getIsNeutered(),
                request.getNote()
        );

        return DogDto.DetailResponse.from(dog);
    }

    // 반려견 삭제
    @Transactional
    public void deleteDog(Long memberId, Long dogId) {
        Dog dog = getDogByMember(memberId, dogId);

        dogRepository.delete(dog);
    }

    // 반려견 인증
    @Transactional
    public DogDto.DetailResponse verifyDog(Long memberId, Long dogId, DogDto.VerifyRequest request) {
        Dog dog = getDogByMember(memberId, dogId);
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
        String animalRegistrationNumber = request.getAnimalRegistrationNumber().trim();

        boolean verified = animalRegistrationClient.verify(animalRegistrationNumber, member.getRealName());

        if (!verified) {
            throw new CustomException(DogErrorCode.DOG_VERIFICATION_FAILED);
        }

        dog.verify(animalRegistrationNumber);

        return DogDto.DetailResponse.from(dog);
    }

    // 회원 소유 반려견 조회
    private Dog getDogByMember(Long memberId, Long dogId) {
        return dogRepository.findByIdAndMemberId(dogId, memberId)
                .orElseThrow(() -> new CustomException(DogErrorCode.DOG_NOT_FOUND));
    }
}
