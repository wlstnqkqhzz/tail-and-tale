import api from "./axios";

// 인증(OAuth) 관련 API 및 유틸

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const oauthLogin = {
    google: `${API_BASE_URL}/oauth2/authorization/google`,
    kakao: `${API_BASE_URL}/oauth2/authorization/kakao`,
    naver: `${API_BASE_URL}/oauth2/authorization/naver`,
};

// OAuth 로그인 페이지로 이동
export const redirectToOAuth = (provider) => {
    window.location.href = oauthLogin[provider];
};

// 로그아웃
export const logout = () => {
    const refreshToken = localStorage.getItem("refreshToken");

    return api.post("/api/members/logout", {
        refreshToken,
    });
};