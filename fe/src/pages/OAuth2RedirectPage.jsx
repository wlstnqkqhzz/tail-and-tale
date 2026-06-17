// OAuth 로그인 성공 후 토큰 처리 페이지

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2RedirectPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const status = params.get("status");

        if (!accessToken) {
            alert("로그인에 실패했습니다.");
            navigate("/");
            return;
        }

        localStorage.setItem("accessToken", accessToken);

        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        if (status === "PENDING") {
            navigate("/oauth2/profile-complete", { replace: true });
            return;
        }

        navigate("/", { replace: true });
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-gray-500">로그인 처리 중...</p>
        </div>
    );
}
