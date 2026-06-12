// 인증 관련 Hook

import { useEffect, useState } from "react";
import { clearTokens, getAccessToken } from "../utils/token";
import { getMyInfo } from "../api/member";

// 로그인 회원 정보 조회 Hook
export function useAuth() {
    const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));
    const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getAccessToken()));
    const [member, setMember] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const accessToken = getAccessToken();

        if (!accessToken) {
            return;
        }

        const fetchMember = async () => {
            try {
                const response = await getMyInfo();

                if (!isMounted) return;

                setMember(response.data);
            } catch (error) {
                console.error(error);

                if (!isMounted) return;

                clearTokens();
                setIsLoggedIn(false);
                setMember(null);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchMember();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        isLoading,
        isLoggedIn,
        member,
    };
}
