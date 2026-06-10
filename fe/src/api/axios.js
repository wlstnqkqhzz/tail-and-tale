import axios from "axios";

// 공통 axios 인스턴스 생성
const api = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true,
});

export default api;