package com.tailandtale.domain.dog.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

// 반려견 Entity

@Entity
@Table(name = "dog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dog extends BaseEntity {

    // 반려견 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dog_id")
    private Long id;

    // 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 반려견 이름
    @Column(nullable = false, length = 30)
    private String name;

    // 견종
    @Column(length = 50)
    private String breed;

    // 성별
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DogGender gender = DogGender.UNKNOWN;

    // 생년월일
    @Column(name = "birth_date")
    private LocalDate birthDate;

    // 몸무게
    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    // 크기
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DogSize size;

    // 성향
    @Column(length = 200)
    private String personality;

    // 프로필 이미지 URL
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // 중성화 여부
    @Column(name = "is_neutered", nullable = false)
    private Boolean isNeutered = false;

    // 특이사항
    @Column(length = 500)
    private String note;

    // 반려견 생성
    private Dog(
            Member member,
            String name,
            String breed,
            DogGender gender,
            LocalDate birthDate,
            BigDecimal weight,
            DogSize size,
            String personality,
            String profileImageUrl,
            Boolean isNeutered,
            String note
    ) {
        this.member = member;
        this.name = name;
        this.breed = breed;
        this.gender = gender == null ? DogGender.UNKNOWN : gender;
        this.birthDate = birthDate;
        this.weight = weight;
        this.size = size;
        this.personality = personality;
        this.profileImageUrl = profileImageUrl;
        this.isNeutered = isNeutered != null && isNeutered;
        this.note = note;
    }

    // 반려견 생성
    public static Dog create(
            Member member,
            String name,
            String breed,
            DogGender gender,
            LocalDate birthDate,
            BigDecimal weight,
            DogSize size,
            String personality,
            String profileImageUrl,
            Boolean isNeutered,
            String note
    ) {
        return new Dog(
                member,
                name,
                breed,
                gender,
                birthDate,
                weight,
                size,
                personality,
                profileImageUrl,
                isNeutered,
                note
        );
    }

    // 반려견 정보 수정
    public void update(
            String name,
            String breed,
            DogGender gender,
            LocalDate birthDate,
            BigDecimal weight,
            DogSize size,
            String personality,
            String profileImageUrl,
            Boolean isNeutered,
            String note
    ) {
        if (name != null) {
            this.name = name;
        }
        if (breed != null) {
            this.breed = breed;
        }
        if (gender != null) {
            this.gender = gender;
        }
        if (birthDate != null) {
            this.birthDate = birthDate;
        }
        if (weight != null) {
            this.weight = weight;
        }
        if (size != null) {
            this.size = size;
        }
        if (personality != null) {
            this.personality = personality;
        }
        if (profileImageUrl != null) {
            this.profileImageUrl = profileImageUrl;
        }
        if (isNeutered != null) {
            this.isNeutered = isNeutered;
        }
        if (note != null) {
            this.note = note;
        }
    }
}
