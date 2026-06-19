package com.tailandtale.domain.care.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tailandtale.domain.care.entity.RiskLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

// Gemini AI 분석 Client

@Component
public class GeminiAiAnalysisClient implements AiAnalysisClient {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    @Value("${app.gemini.enabled:false}")
    private boolean enabled;

    @Value("${app.gemini.api-url:https://generativelanguage.googleapis.com/v1beta}")
    private String apiUrl;

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String model;

    // Gemini 분석 요청
    @Override
    public AiGeneratedAnalysis analyze(String prompt) {
        validateReady();

        String responseBody = restClient.post()
                .uri(createGenerateContentUri())
                .body(createRequestBody(prompt))
                .retrieve()
                .body(String.class);

        try {
            String responseText = extractResponseText(responseBody);
            JsonNode analysisNode = objectMapper.readTree(cleanJson(responseText));

            return new AiGeneratedAnalysis(
                    limit(analysisNode.path("summary").asText(), 500),
                    defaultText(analysisNode.path("resultContent").asText(), "AI 분석 결과를 생성하지 못했습니다."),
                    parseRiskLevel(analysisNode.path("riskLevel").asText()),
                    defaultText(analysisNode.path("guideContent").asText(), "기록을 꾸준히 남기며 변화를 관찰해주세요.")
            );
        } catch (Exception e) {
            throw new IllegalStateException("Gemini 분석 JSON을 해석하지 못했습니다.", e);
        }
    }

    // Gemini 설정 검증
    private void validateReady() {
        if (!enabled || !StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("Gemini AI 분석 설정이 비활성화되어 있습니다.");
        }
    }

    // GenerateContent URI 생성
    private URI createGenerateContentUri() {
        return UriComponentsBuilder.fromUriString(removeTrailingSlash(apiUrl))
                .path("/models/{model}:generateContent")
                .queryParam("key", apiKey)
                .buildAndExpand(normalizeModel(model))
                .toUri();
    }

    // GenerateContent 요청 Body 생성
    private Map<String, Object> createRequestBody(String prompt) {
        return Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "responseMimeType", "application/json"
                )
        );
    }

    // Gemini 응답 본문에서 텍스트 추출
    private String extractResponseText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new IllegalStateException("Gemini 응답 후보가 없습니다.");
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");

            if (!parts.isArray() || parts.isEmpty()) {
                throw new IllegalStateException("Gemini 응답 텍스트가 없습니다.");
            }

            String text = parts.get(0).path("text").asText();

            if (!StringUtils.hasText(text)) {
                throw new IllegalStateException("Gemini 응답 텍스트가 비어 있습니다.");
            }

            return text;
        } catch (Exception e) {
            throw new IllegalStateException("Gemini 응답을 해석하지 못했습니다.", e);
        }
    }

    // JSON 코드블록 제거
    private String cleanJson(String text) {
        return text
                .replaceFirst("^```json\\s*", "")
                .replaceFirst("^```\\s*", "")
                .replaceFirst("\\s*```$", "")
                .trim();
    }

    // 위험도 변환
    private RiskLevel parseRiskLevel(String value) {
        if (!StringUtils.hasText(value)) {
            return RiskLevel.LOW;
        }

        try {
            return RiskLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return RiskLevel.LOW;
        }
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String limit(String value, int maxLength) {
        String target = defaultText(value, "AI 분석 결과를 생성했습니다.");

        if (target.length() <= maxLength) {
            return target;
        }

        return target.substring(0, maxLength);
    }

    private String normalizeModel(String model) {
        return model.replaceFirst("^models/", "");
    }

    private String removeTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
