import { logout } from "../api/auth";
import { clearTokens } from "./token";

// 로그아웃 처리

export const logoutUser = async () => {
    try {
        await logout();
    } catch (error) {
        console.error(error);
    } finally {
        clearTokens();
        window.location.href = "/";
    }
};