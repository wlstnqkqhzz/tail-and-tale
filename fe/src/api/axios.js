import axios from "axios";
import { clearTokens, getAccessToken, setTokens } from "../utils/token";

// Axios 공통 설정

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

let isReissuing = false;
let pendingRequests = [];
const REISSUE_SKIP_URLS = [
    "/api/members/login",
    "/api/members/signup",
    "/api/members/reactivate",
    "/api/members/reissue",
    "/api/members/oauth2/code/exchange",
    "/api/members/logout",
];

api.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (!originalRequest || status !== 401 || originalRequest._retry || shouldSkipReissue(originalRequest.url)) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isReissuing) {
            return new Promise((resolve, reject) => {
                pendingRequests.push({ resolve, reject });
            })
                .then((accessToken) => {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                })
                .catch((queueError) => Promise.reject(queueError));
        }

        try {
            isReissuing = true;

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/members/reissue`,
                null,
                { withCredentials: true }
            );
            const nextTokens = {
                accessToken: response.data.accessToken,
            };

            setTokens(nextTokens);
            resolvePendingRequests(nextTokens.accessToken);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextTokens.accessToken}`;
            return api(originalRequest);
        } catch (reissueError) {
            clearTokens();
            rejectPendingRequests(reissueError);
            return Promise.reject(reissueError);
        } finally {
            isReissuing = false;
            pendingRequests = [];
        }
    }
);

function resolvePendingRequests(accessToken) {
    pendingRequests.forEach(({ resolve }) => resolve(accessToken));
}

function rejectPendingRequests(error) {
    pendingRequests.forEach(({ reject }) => reject(error));
}

function shouldSkipReissue(url = "") {
    return REISSUE_SKIP_URLS.some((skipUrl) => url.includes(skipUrl));
}

export default api;
