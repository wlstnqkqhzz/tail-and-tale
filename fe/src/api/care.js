import api from "./axios";

// 감정 다이어리 생성
export const createEmotionDiary = (data) => {
    return api.post("/api/emotion-diaries", data);
};

// 감정 다이어리 목록 조회
export const getEmotionDiaries = (params) => {
    return api.get("/api/emotion-diaries", { params });
};

// 감정 다이어리 수정
export const updateEmotionDiary = (emotionDiaryId, data) => {
    return api.patch(`/api/emotion-diaries/${emotionDiaryId}`, data);
};

// 감정 다이어리 삭제
export const deleteEmotionDiary = (emotionDiaryId) => {
    return api.delete(`/api/emotion-diaries/${emotionDiaryId}`);
};

// 건강 기록 생성
export const createHealthRecord = (data) => {
    return api.post("/api/health-records", data);
};

// 건강 기록 목록 조회
export const getHealthRecords = (params) => {
    return api.get("/api/health-records", { params });
};

// 건강 기록 수정
export const updateHealthRecord = (healthRecordId, data) => {
    return api.patch(`/api/health-records/${healthRecordId}`, data);
};

// 건강 기록 삭제
export const deleteHealthRecord = (healthRecordId) => {
    return api.delete(`/api/health-records/${healthRecordId}`);
};

// 케어 요약 조회
export const getCareSummary = (params) => {
    return api.get("/api/care/summary", { params });
};

// AI 분석 생성
export const createAiAnalysis = (data) => {
    return api.post("/api/care/analyses", data);
};

// AI 분석 목록 조회
export const getAiAnalyses = (params) => {
    return api.get("/api/care/analyses", { params });
};
