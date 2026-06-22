package com.tailandtale.domain.dog.service;

import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

// 반려견 이미지 파일 저장 서비스

@Service
public class DogImageStorageService {
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private final Path uploadDirectory = Paths.get("uploads", "dogs").toAbsolutePath().normalize();

    // 반려견 이미지 저장
    public String store(MultipartFile file) {
        validateFile(file);

        try {
            Files.createDirectories(uploadDirectory);

            String extension = extractExtension(file.getOriginalFilename());
            String storedFileName = UUID.randomUUID() + "." + extension;
            Path targetPath = uploadDirectory.resolve(storedFileName).normalize();

            file.transferTo(targetPath);

            return "/uploads/dogs/" + storedFileName;
        } catch (IOException exception) {
            throw new CustomException(DogErrorCode.DOG_IMAGE_UPLOAD_FAILED);
        }
    }

    // 이미지 파일 검증
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException(DogErrorCode.DOG_IMAGE_REQUIRED);
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new CustomException(DogErrorCode.DOG_IMAGE_TOO_LARGE);
        }

        String extension = extractExtension(file.getOriginalFilename());
        String contentType = file.getContentType();

        if (!ALLOWED_EXTENSIONS.contains(extension)
                || contentType == null
                || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new CustomException(DogErrorCode.DOG_IMAGE_INVALID_TYPE);
        }
    }

    // 파일 확장자 추출
    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new CustomException(DogErrorCode.DOG_IMAGE_INVALID_TYPE);
        }

        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);
    }
}
