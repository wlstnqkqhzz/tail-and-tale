package com.tailandtale.domain.dog.controller;

import com.tailandtale.domain.dog.dto.DogDto;
import com.tailandtale.domain.dog.service.DogImageStorageService;
import com.tailandtale.domain.dog.service.DogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;

// 반려견 정보 CRUD API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dogs")
public class DogController {
    private final DogService dogService;
    private final DogImageStorageService dogImageStorageService;

    // 반려견 등록
    @PostMapping
    public ResponseEntity<DogDto.DetailResponse> registerDog(@Valid @RequestBody DogDto.RegisterRequest request) {
        Long memberId = getLoginMemberId();

        return ResponseEntity.ok(dogService.registerDog(memberId, request));
    }

    // 내 반려견 목록 조회
    @GetMapping
    public ResponseEntity<List<DogDto.DetailResponse>> getMyDogs() {
        Long memberId = getLoginMemberId();

        return ResponseEntity.ok(dogService.getMyDogs(memberId));
    }

    // 내 반려견 상세 조회
    @GetMapping("/{dogId}")
    public ResponseEntity<DogDto.DetailResponse> getMyDog(@PathVariable Long dogId) {
        Long memberId = getLoginMemberId();

        return ResponseEntity.ok(dogService.getMyDog(memberId, dogId));
    }

    // 반려견 정보 수정
    @PatchMapping("/{dogId}")
    public ResponseEntity<DogDto.DetailResponse> updateDog(@PathVariable Long dogId, @Valid @RequestBody DogDto.UpdateRequest request) {
        Long memberId = getLoginMemberId();

        return ResponseEntity.ok(dogService.updateDog(memberId, dogId, request));
    }

    // 반려견 삭제
    @DeleteMapping("/{dogId}")
    public ResponseEntity<Void> deleteDog(@PathVariable Long dogId) {
        Long memberId = getLoginMemberId();

        dogService.deleteDog(memberId, dogId);

        return ResponseEntity.noContent().build();
    }

    // 반려견 인증
    @PostMapping("/{dogId}/verify")
    public ResponseEntity<DogDto.DetailResponse> verifyDog(@PathVariable Long dogId, @Valid @RequestBody DogDto.VerifyRequest request) {
        Long memberId = getLoginMemberId();

        return ResponseEntity.ok(dogService.verifyDog(memberId, dogId, request));
    }

    // 반려견 이미지 업로드
    @PostMapping("/images")
    public ResponseEntity<DogDto.ImageUploadResponse> uploadDogImage(@RequestParam("image") MultipartFile image) {
        String imagePath = dogImageStorageService.store(image);
        String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(imagePath)
                .toUriString();

        return ResponseEntity.ok(
                DogDto.ImageUploadResponse.builder()
                        .profileImageUrl(imageUrl)
                        .build()
        );
    }

    // 현재 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
