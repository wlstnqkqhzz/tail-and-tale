// 토큰 관련 유틸

export const getAccessToken = () =>
    localStorage.getItem("accessToken");

export const getRefreshToken = () =>
    localStorage.getItem("refreshToken");

export const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};