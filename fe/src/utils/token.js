// 토큰 관련 유틸

export const getAccessToken = () =>
    localStorage.getItem("accessToken");

// Access Token에서 로그인 회원 ID 조회
export const getAccessTokenMemberId = () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
        return null;
    }

    try {
        const encodedPayload = accessToken.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const paddedPayload = encodedPayload.padEnd(
            Math.ceil(encodedPayload.length / 4) * 4,
            "=",
        );

        return JSON.parse(atob(paddedPayload)).sub || null;
    } catch {
        return null;
    }
};

export const setTokens = ({ accessToken }) => {
    if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
    }
};

export const clearTokens = () => {
    localStorage.removeItem("accessToken");
};
