// OAuth 로그인 성공 후 인증 코드 처리 페이지

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeOAuth2Code } from "../../api/auth";
import { setTokens } from "../../utils/token";

export default function OAuth2RedirectPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const status = params.get("status");
        const error = params.get("error");
        const message = params.get("message");

        const handleRedirect = async () => {
            if (error) {
                alert(message || "로그인에 실패했습니다.");
                navigate("/", { replace: true });
                return;
            }

            if (!code) {
                alert("로그인에 실패했습니다.");
                navigate("/", { replace: true });
                return;
            }

            try {
                const response = await exchangeOAuth2Code(code);

                setTokens({
                    accessToken: response.data.accessToken,
                });

                if (status === "PENDING") {
                    navigate("/oauth2/profile-complete", { replace: true });
                    return;
                }

                navigate("/", { replace: true });
            } catch (exchangeError) {
                console.error(exchangeError);
                alert(exchangeError.response?.data?.message || "로그인에 실패했습니다.");
                navigate("/", { replace: true });
            }
        };

        handleRedirect();
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-gray-500">로그인 처리 중...</p>
        </div>
    );
}
