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

// OAuth2 인증 코드 교환
export const exchangeOAuth2Code = (code) => {
    return api.post("/api/members/oauth2/code/exchange", { code });
};

// 로그아웃
export const logout = () => {
    return api.post("/api/members/logout");
};
