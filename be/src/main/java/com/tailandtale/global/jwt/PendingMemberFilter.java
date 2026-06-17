package com.tailandtale.global.jwt;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberStatus;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.global.exception.MemberErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

// OAuth 추가 정보 입력 전 API 접근 제한 필터

@Component
@RequiredArgsConstructor
public class PendingMemberFilter extends OncePerRequestFilter {

    private final MemberRepository memberRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!isApiRequest(request) || isPendingAllowedRequest(request) || authentication == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Long memberId)) {
            filterChain.doFilter(request, response);
            return;
        }

        Member member = memberRepository.findById(memberId).orElse(null);

        if (member != null && member.getStatus() == MemberStatus.PENDING) {
            writePendingResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    // API 요청 여부 확인
    private boolean isApiRequest(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/");
    }

    // PENDING 회원 허용 API 확인
    private boolean isPendingAllowedRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (HttpMethod.OPTIONS.matches(method)) {
            return true;
        }

        if (HttpMethod.GET.matches(method) && "/api/members/me".equals(uri)) {
            return true;
        }

        return HttpMethod.PATCH.matches(method)
                && "/api/members/me/profile/complete".equals(uri);
    }

    // PENDING 회원 차단 응답 작성
    private void writePendingResponse(HttpServletResponse response) throws IOException {
        response.setStatus(MemberErrorCode.PROFILE_INCOMPLETE.getStatus().value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("""
                {"status":403,"error":"FORBIDDEN","message":"추가 정보를 먼저 입력해주세요."}
                """);
    }
}
