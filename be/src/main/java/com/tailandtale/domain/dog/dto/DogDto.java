package com.tailandtale.domain.dog.dto;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.entity.DogGender;
import com.tailandtale.domain.dog.entity.DogSize;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// 반려견 요청 및 응답 DTO 정의 클래스

public class DogDto {

    // 반려견 등록 DTO
    @Getter
    public static class RegisterRequest{
        @NotBlank(message = "반려견 이름은 필수입니다.")
        private String name;

        private String breed;

        private DogGender gender;

        @PastOrPresent(message = "생년월일은 미래 날짜일 수 없습니다.")
        private LocalDate birthDate;

        @DecimalMin(value = "0.01", message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "999.99", message = "몸무게는 999.99kg 이하로 입력해주세요.")
        private BigDecimal weight;

        private DogSize size;

        private String personality;
        private String profileImageUrl;

        @NotNull(message = "중성화 여부는 필수입니다.")
        private Boolean isNeutered;

        private String note;
    }

    // 반려견 정보 응답 DTO
    @Getter
    @Builder
    public static class DetailResponse{
        private Long dogId;

        private String name;
        private String breed;

        private DogGender gender;
        private LocalDate birthDate;

        private BigDecimal weight;
        private DogSize size;

        private String personality;
        private String profileImageUrl;

        private String animalRegistrationNumber;
        private Boolean isVerified;
        private LocalDateTime verifiedAt;

        private Boolean isNeutered;
        private String note;

        public static DetailResponse from(Dog dog) {
            return DetailResponse.builder()
                    .dogId(dog.getId())
                    .name(dog.getName())
                    .breed(dog.getBreed())
                    .gender(dog.getGender())
                    .birthDate(dog.getBirthDate())
                    .weight(dog.getWeight())
                    .size(dog.getSize())
                    .personality(dog.getPersonality())
                    .profileImageUrl(dog.getProfileImageUrl())
                    .animalRegistrationNumber(dog.getAnimalRegistrationNumber())
                    .isVerified(dog.getIsVerified())
                    .verifiedAt(dog.getVerifiedAt())
                    .isNeutered(dog.getIsNeutered())
                    .note(dog.getNote())
                    .build();
        }
    }

    // 반려견 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {
        @Pattern(regexp = ".*\\S.*", message = "반려견 이름은 공백일 수 없습니다.")
        private String name;

        private String breed;

        private DogGender gender;

        @PastOrPresent(message = "생년월일은 미래 날짜일 수 없습니다.")
        private LocalDate birthDate;

        @DecimalMin(value = "0.01", message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "999.99", message = "몸무게는 999.99kg 이하로 입력해주세요.")
        private BigDecimal weight;

        private DogSize size;

        private String personality;
        private String profileImageUrl;

        private Boolean isNeutered;
        private String note;
    }

    // 반려견 인증 요청 DTO
    @Getter
    @NoArgsConstructor
    public static class VerifyRequest {

        @NotBlank(message = "동물등록번호는 필수입니다.")
        private String animalRegistrationNumber;
    }
}
