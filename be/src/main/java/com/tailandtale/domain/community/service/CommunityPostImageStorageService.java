package com.tailandtale.domain.community.service;

import com.tailandtale.global.exception.CommunityErrorCode;
import com.tailandtale.global.exception.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

// 커뮤니티 게시글 이미지 파일 저장 서비스

@Service
public class CommunityPostImageStorageService {
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private final Path uploadDirectory = Paths.get("uploads", "community").toAbsolutePath().normalize();

    // 게시글 이미지 저장
    public StoredImage store(MultipartFile file) {
        validateFile(file);

        try {
            Files.createDirectories(uploadDirectory);

            String originalFileName = file.getOriginalFilename();
            String extension = extractExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + "." + extension;
            Path targetPath = uploadDirectory.resolve(storedFileName).normalize();

            file.transferTo(targetPath);

            return new StoredImage(
                    "/uploads/community/" + storedFileName,
                    originalFileName,
                    storedFileName,
                    file.getContentType(),
                    file.getSize()
            );
        } catch (IOException exception) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_IMAGE_UPLOAD_FAILED);
        }
    }

    // 이미지 파일 검증
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_IMAGE_REQUIRED);
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_IMAGE_TOO_LARGE);
        }

        String extension = extractExtension(file.getOriginalFilename());
        String contentType = file.getContentType();

        if (!ALLOWED_EXTENSIONS.contains(extension)
                || contentType == null
                || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_IMAGE_INVALID_TYPE);
        }
    }

    // 파일 확장자 추출
    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new CustomException(CommunityErrorCode.COMMUNITY_POST_IMAGE_INVALID_TYPE);
        }

        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);
    }

    // 저장 이미지 정보
    public record StoredImage(
            String imageUrl,
            String originalFileName,
            String storedFileName,
            String contentType,
            Long fileSize
    ) {
    }
}
