package com.tailandtale.domain.member.controller;

import com.tailandtale.domain.member.dto.LoginFormDto;
import com.tailandtale.domain.member.dto.MemberDto;
import com.tailandtale.domain.member.service.MemberService;
import com.tailandtale.global.security.RefreshTokenCookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// 회원 정보 CRUD 및 인증 정보 조회 API 컨트롤러

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members")
public class MemberController {
    private final MemberService memberService;

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<LoginFormDto.TokenResponse> login(
            @Valid @RequestBody LoginFormDto.LoginRequest request,
            HttpServletResponse response
    ) {
        LoginFormDto.TokenResponse tokenResponse = memberService.login(request);
        RefreshTokenCookieUtil.add(response, tokenResponse.getRefreshToken(), memberService.getRefreshTokenExpiration());

        return ResponseEntity.ok(tokenResponse);
    }

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@Valid @RequestBody MemberDto.SignupRequest signupRequest) {
        memberService.signup(signupRequest);
        return ResponseEntity.ok().build();
    }

    // 회원 상세 조회
    @GetMapping("/{memberId}")
    public ResponseEntity<MemberDto.DetailResponse> getMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(memberService.getMember(memberId));
    }

    // OAuth 추가 정보 입력 완료
    @PatchMapping("/me/profile/complete")
    public ResponseEntity<MemberDto.DetailResponse> completeProfile(@Valid @RequestBody MemberDto.CompleteProfileRequest request) {
        return ResponseEntity.ok(memberService.completeProfile(getLoginMemberId(), request));
    }

    // 내 정보 수정
    @PatchMapping("/me")
    public ResponseEntity<MemberDto.DetailResponse> updateMyProfile(@Valid @RequestBody MemberDto.UpdateRequest request) {
        return ResponseEntity.ok(memberService.updateMyProfile(getLoginMemberId(), request));
    }

    // 비밀번호 확인
    @PostMapping("/me/password/verify")
    public ResponseEntity<Void> verifyMyPassword(@Valid @RequestBody MemberDto.PasswordConfirmRequest request) {
        memberService.verifyMyPassword(getLoginMemberId(), request);
        return ResponseEntity.noContent().build();
    }

    // 회원 탈퇴
    @PatchMapping("/me/withdraw")
    public ResponseEntity<Void> withdraw(@Valid @RequestBody MemberDto.PasswordConfirmRequest request) {
        memberService.withdraw(getLoginMemberId(), request);
        return ResponseEntity.noContent().build();
    }

    // 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<MemberDto.DetailResponse> getMyInfo() {
        return ResponseEntity.ok(memberService.getMember(getLoginMemberId()));
    }

    // 내 마이페이지 대시보드 조회
    @GetMapping("/me/dashboard")
    public ResponseEntity<MemberDto.DashboardResponse> getMyDashboard() {
        return ResponseEntity.ok(memberService.getMyDashboard(getLoginMemberId()));
    }

    // Refresh Token 재발급
    @PostMapping("/reissue")
    public ResponseEntity<LoginFormDto.TokenResponse> reissue(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        LoginFormDto.TokenResponse tokenResponse = memberService.reissue(RefreshTokenCookieUtil.resolve(request));
        RefreshTokenCookieUtil.add(response, tokenResponse.getRefreshToken(), memberService.getRefreshTokenExpiration());

        return ResponseEntity.ok(tokenResponse);
    }

    // OAuth2 인증 코드 교환
    @PostMapping("/oauth2/code/exchange")
    public ResponseEntity<LoginFormDto.TokenResponse> exchangeOAuth2Code(
            @Valid @RequestBody LoginFormDto.OAuth2CodeExchangeRequest request,
            HttpServletResponse response
    ) {
        LoginFormDto.TokenResponse tokenResponse = memberService.exchangeOAuth2Code(request);
        RefreshTokenCookieUtil.add(response, tokenResponse.getRefreshToken(), memberService.getRefreshTokenExpiration());

        return ResponseEntity.ok(tokenResponse);
    }

    // 휴면 계정 재활성화
    @PostMapping("/reactivate")
    public ResponseEntity<Void> reactivateDormantAccount(@Valid @RequestBody LoginFormDto.LoginRequest request) {
        memberService.reactivateDormantAccount(request);
        return ResponseEntity.noContent().build();
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        memberService.logout(RefreshTokenCookieUtil.resolve(request));
        RefreshTokenCookieUtil.delete(response);

        return ResponseEntity.noContent().build();
    }

    // 로그인 회원 ID 조회
    private Long getLoginMemberId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
