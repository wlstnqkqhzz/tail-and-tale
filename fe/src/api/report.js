import api from "./axios";

// 신고 생성
export const createReport = (data) => {
    return api.post("/api/reports", data);
};
