package com.tailandtale.global.animal;

import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.DogErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 동물등록번호 공공 API 호출 Client

@Component
public class AnimalRegistrationClient {
    private final RestClient restClient = RestClient.create();
    private static final Pattern JSON_TOTAL_COUNT_PATTERN = Pattern.compile("\"totalCount\"\\s*:\\s*\"?(\\d+)\"?");
    private static final Pattern XML_TOTAL_COUNT_PATTERN = Pattern.compile("<totalCount>\\s*(\\d+)\\s*</totalCount>");

    @Value("${app.animal-registration.enabled}")
    private boolean enabled;

    @Value("${app.animal-registration.api-url}")
    private String apiUrl;

    @Value("${app.animal-registration.service-key}")
    private String serviceKey;

    @Value("${app.animal-registration.service-key-param}")
    private String serviceKeyParam;

    @Value("${app.animal-registration.registration-number-param}")
    private String registrationNumberParam;

    @Value("${app.animal-registration.owner-name-param}")
    private String ownerNameParam;

    @Value("${app.animal-registration.response-type-param}")
    private String responseTypeParam;

    @Value("${app.animal-registration.response-type}")
    private String responseType;

    // 동물등록번호 인증
    public boolean verify(String animalRegistrationNumber, String ownerName) {
        if (!enabled || !StringUtils.hasText(apiUrl) || !StringUtils.hasText(serviceKey)) {
            throw new CustomException(DogErrorCode.DOG_VERIFICATION_NOT_READY);
        }

        if (!StringUtils.hasText(ownerName)) {
            throw new CustomException(DogErrorCode.DOG_VERIFICATION_OWNER_REQUIRED);
        }

        try {
            String responseBody = restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder = uriBuilder
                                .scheme(getScheme())
                                .host(getHost())
                                .path(getPath())
                                .queryParam(serviceKeyParam, serviceKey)
                                .queryParam(registrationNumberParam, animalRegistrationNumber)
                                .queryParam(ownerNameParam, ownerName);

                        if (StringUtils.hasText(responseTypeParam) && StringUtils.hasText(responseType)) {
                            uriBuilder.queryParam(responseTypeParam, responseType);
                        }

                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(String.class);

            return isVerifiedResponse(responseBody, animalRegistrationNumber);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(DogErrorCode.DOG_VERIFICATION_API_ERROR);
        }
    }

    // 인증 응답 확인
    private boolean isVerifiedResponse(String responseBody, String animalRegistrationNumber) {
        if (!StringUtils.hasText(responseBody)) {
            return false;
        }

        Integer totalCount = extractTotalCount(responseBody);
        boolean hasRegistrationNumber = containsRegistrationNumber(responseBody, animalRegistrationNumber);

        if (totalCount != null) {
            return totalCount > 0 && hasRegistrationNumber;
        }

        return false;
    }

    // 응답 본문에 입력한 동물등록번호가 실제로 포함되어 있는지 확인
    private boolean containsRegistrationNumber(String responseBody, String animalRegistrationNumber) {
        String normalizedResponseBody = normalizeRegistrationNumber(responseBody);
        String normalizedRegistrationNumber = normalizeRegistrationNumber(animalRegistrationNumber);

        return StringUtils.hasText(normalizedRegistrationNumber)
                && normalizedResponseBody.contains(normalizedRegistrationNumber);
    }

    // 동물등록번호 비교를 위해 공백과 구분문자 제거
    private String normalizeRegistrationNumber(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.replaceAll("[^0-9A-Za-z]", "");
    }

    // 전체 결과 수 추출
    private Integer extractTotalCount(String responseBody) {
        Matcher jsonMatcher = JSON_TOTAL_COUNT_PATTERN.matcher(responseBody);

        if (jsonMatcher.find()) {
            return Integer.parseInt(jsonMatcher.group(1));
        }

        Matcher xmlMatcher = XML_TOTAL_COUNT_PATTERN.matcher(responseBody);

        if (xmlMatcher.find()) {
            return Integer.parseInt(xmlMatcher.group(1));
        }

        return null;
    }

    // API Scheme 추출
    private String getScheme() {
        return apiUrl.startsWith("https://") ? "https" : "http";
    }

    // API Host 추출
    private String getHost() {
        return removeScheme(apiUrl).split("/", 2)[0];
    }

    // API Path 추출
    private String getPath() {
        String[] parts = removeScheme(apiUrl).split("/", 2);

        return parts.length > 1 ? "/" + parts[1] : "";
    }

    // Scheme 제거
    private String removeScheme(String url) {
        return url.replaceFirst("^https?://", "");
    }
}
