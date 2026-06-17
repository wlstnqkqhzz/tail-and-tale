// OAuth 추가 정보 입력 전 접근 제한 가드

import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMyInfo } from "../../api/member";
import { getAccessToken } from "../../utils/token";

const pendingAllowedPaths = [
    "/oauth2/redirect",
    "/oauth2/profile-complete",
];

export default function OAuth2PendingGuard() {
    const location = useLocation();
    const navigate = useNavigate();
    const lastAlertPathRef = useRef("");
    const [isChecking, setIsChecking] = useState(() => Boolean(getAccessToken()));

    // PENDING 회원은 추가 정보 입력 페이지로 고정
    useEffect(() => {
        const checkMemberStatus = async () => {
            const accessToken = getAccessToken();

            if (!accessToken) {
                setIsChecking(false);
                return;
            }

            if (location.pathname === "/oauth2/redirect") {
                setIsChecking(false);
                return;
            }

            try {
                setIsChecking(true);

                const response = await getMyInfo();
                const member = response.data;
                const isPendingAllowedPath = pendingAllowedPaths.includes(location.pathname);

                if (member.status === "PENDING" && !isPendingAllowedPath) {
                    if (lastAlertPathRef.current !== location.pathname) {
                        alert("추가 정보를 먼저 입력해주세요.");
                        lastAlertPathRef.current = location.pathname;
                    }

                    navigate("/oauth2/profile-complete", { replace: true });
                    return;
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsChecking(false);
            }
        };

        checkMemberStatus();
    }, [location.pathname, navigate]);

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
                회원 상태를 확인하는 중...
            </div>
        );
    }

    return <Outlet />;
}
