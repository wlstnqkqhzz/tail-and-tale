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

// 산책 모집 마감
export const closeWalkSchedule = (walkScheduleId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/close`);
};

// 산책 모집 재개
export const reopenWalkSchedule = (walkScheduleId) => {
    return api.patch(`/api/walk-schedules/${walkScheduleId}/reopen`);
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

// 산책 후기 작성
export const createWalkReview = (walkScheduleId, data) => {
    return api.post(`/api/walk-schedules/${walkScheduleId}/reviews`, data);
};

// 산책 후기 목록 조회
export const getWalkReviews = (walkScheduleId) => {
    return api.get(`/api/walk-schedules/${walkScheduleId}/reviews`);
};

// 내가 작성한 산책 후기 조회
export const getMyWrittenWalkReviews = () => {
    return api.get("/api/walk-reviews/me/written");
};

// 내가 받은 산책 후기 조회
export const getMyReceivedWalkReviews = () => {
    return api.get("/api/walk-reviews/me/received");
};

// 산책 후기 수정
export const updateWalkReview = (walkReviewId, data) => {
    return api.patch(`/api/walk-reviews/${walkReviewId}`, data);
};

// 산책 후기 삭제
export const deleteWalkReview = (walkReviewId) => {
    return api.delete(`/api/walk-reviews/${walkReviewId}`);
};
