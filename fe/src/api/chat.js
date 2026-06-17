import api from "./axios";

// 내 채팅방 목록 조회
export const getChatRooms = () => {
    return api.get("/api/chat/rooms");
};

// 산책 일정 채팅방 조회
export const getWalkChatRoom = (walkScheduleId) => {
    return api.get(`/api/walk-schedules/${walkScheduleId}/chat-room`);
};

// 채팅 메시지 목록 조회
export const getChatMessages = (chatRoomId, params) => {
    return api.get(`/api/chat/rooms/${chatRoomId}/messages`, { params });
};

// 채팅방 읽음 처리
export const readChatRoom = (chatRoomId, data) => {
    return api.patch(`/api/chat/rooms/${chatRoomId}/read`, data);
};
