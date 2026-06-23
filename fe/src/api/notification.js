import api from "./axios";

// 내 알림 목록 조회
export const getNotifications = () => {
    return api.get("/api/notifications");
};

// 내 알림 설정 목록 조회
export const getNotificationSettings = () => {
    return api.get("/api/notifications/settings");
};

// 내 알림 설정 변경
export const updateNotificationSetting = (notificationType, data) => {
    return api.patch(`/api/notifications/settings/${notificationType}`, data);
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
