import api from "./axios";

// 산책 일정 생성
export const createWalkSchedule = (data) => {
    return api.post("/api/walk-schedules", data);
};

// 산책 일정 목록 조회
export const getWalkSchedules = (params) => {
    return api.get("/api/walk-schedules", { params });
};

// 산책 일정 상세 조회
export const getWalkSchedule = (walkScheduleId) => {
    return api.get(`/api/walk-schedules/${walkScheduleId}`);
};

// 산책 참여 신청
export const requestWalkParticipation = (walkScheduleId, data) => {
    return api.post(`/api/walk-schedules/${walkScheduleId}/participants`, data);
};

// 산책 참여자 목록 조회
export const getWalkParticipants = (walkScheduleId) => {
    return api.get(`/api/walk-schedules/${walkScheduleId}/participants`);
};

// 산책 참여 승인
export const approveWalkParticipant = (walkScheduleId, walkParticipantId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/participants/${walkParticipantId}/approve`);
};

// 산책 참여 거절
export const rejectWalkParticipant = (walkScheduleId, walkParticipantId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/participants/${walkParticipantId}/reject`);
};

// 산책 참여 취소
export const cancelWalkParticipation = (walkScheduleId, walkParticipantId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/participants/${walkParticipantId}/cancel`);
};

// 내 산책 참여 취소
export const cancelMyWalkParticipation = (walkScheduleId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/participants/me/cancel`);
};
