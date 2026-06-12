import api from "./axios";

// OAuth 추가 정보 입력 완료
export const completeProfile = (data) => {
    return api.patch("/api/members/me/profile/complete", data);
};

// 내 정보 조회
export const getMyInfo = () => {
    return api.get("/api/members/me");
};