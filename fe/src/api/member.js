import api from "./axios";

// 일반 로그인
export const login = (data) => {
    return api.post("/api/members/login", data);
};

// 회원가입
export const signup = (data) => {
    return api.post("/api/members/signup", data);
};

// OAuth 추가 정보 입력 완료
export const completeProfile = (data) => {
    return api.patch("/api/members/me/profile/complete", data);
};

// 내 정보 조회
export const getMyInfo = () => {
    return api.get("/api/members/me");
};
