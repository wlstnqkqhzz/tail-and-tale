// 토큰 관련 유틸

export const getAccessToken = () =>
    localStorage.getItem("accessToken");

export const setTokens = ({ accessToken }) => {
    if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
    }
};

export const clearTokens = () => {
    localStorage.removeItem("accessToken");
};
