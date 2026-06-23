import api from "./axios";

// 일반 로그인
export const login = (data) => {
    return api.post("/api/members/login", data);
};

// 회원가입
export const signup = (data) => {
    return api.post("/api/members/signup", data);
};

// 휴면 계정 재활성화
export const reactivateDormantAccount = (data) => {
    return api.post("/api/members/reactivate", data);
};

// OAuth 추가 정보 입력 완료
export const completeProfile = (data) => {
    return api.patch("/api/members/me/profile/complete", data);
};

// 내 정보 조회
export const getMyInfo = () => {
    return api.get("/api/members/me");
};

// 회원 미니 프로필 조회
export const getMemberMiniProfile = (memberId) => {
    return api.get(`/api/members/${memberId}/mini-profile`);
};

// 내 정보 수정
export const updateMyProfile = (data) => {
    return api.patch("/api/members/me", data);
};

// 내 비밀번호 확인
export const verifyMyPassword = (data) => {
    return api.post("/api/members/me/password/verify", data);
};

// 회원 탈퇴
export const withdrawMyAccount = (data) => {
    return api.patch("/api/members/me/withdraw", data);
};

// 내 마이페이지 대시보드 조회
export const getMyDashboard = () => {
    return api.get("/api/members/me/dashboard");
};

// 내 차단 목록 조회
export const getMyBlocks = () => {
    return api.get("/api/members/blocks");
};

// 회원 차단
export const blockMember = (memberId, data = {}) => {
    return api.post(`/api/members/${memberId}/block`, data);
};

// 회원 차단 해제
export const unblockMember = (memberId) => {
    return api.delete(`/api/members/${memberId}/block`);
};
