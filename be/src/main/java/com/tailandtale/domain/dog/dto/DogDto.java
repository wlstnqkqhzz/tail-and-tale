package com.tailandtale.domain.dog.dto;

// 반려견 요청 및 응답 DTO 정의 클래스

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.domain.dog.entity.DogGender;
import com.tailandtale.domain.dog.entity.DogSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DogDto {

    // 반려견 등록 DTO
    @Getter
    public static class RegisterRequest{
        @NotBlank(message = "반려견 이름은 필수입니다.")
        private String name;

        private String breed;

        private DogGender gender;
        private LocalDate birthDate;

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
                    .isNeutered(dog.getIsNeutered())
                    .note(dog.getNote())
                    .build();
        }
    }

    // 반려견 수정 DTO
    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String breed;

        private DogGender gender;
        private LocalDate birthDate;

        private BigDecimal weight;
        private DogSize size;

        private String personality;
        private String profileImageUrl;

        private Boolean isNeutered;
        private String note;
    }

}
