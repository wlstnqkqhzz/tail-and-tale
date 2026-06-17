import api from "./axios";

// 내 알림 목록 조회
export const getNotifications = () => {
    return api.get("/api/notifications");
};

// 알림 읽음 처리
export const readNotification = (notificationId) => {
    return api.patch(`/api/notifications/${notificationId}/read`);
};

// 전체 알림 읽음 처리
export const readAllNotifications = () => {
    return api.patch("/api/notifications/read-all");
};

// 대상 알림 전체 읽음 처리
export const readTargetNotifications = (targetType, targetId) => {
    return api.patch(`/api/notifications/targets/${targetType}/${targetId}/read`);
};
