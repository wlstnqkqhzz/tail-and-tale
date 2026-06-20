import api from "./axios";

// 관리자 대시보드 조회
export const getAdminDashboard = () => {
    return api.get("/api/admin/dashboard");
};

// 관리자 회원 목록 조회
export const getAdminMembers = (params) => {
    return api.get("/api/admin/members", { params });
};

// 관리자 회원 상태 변경
export const updateAdminMemberStatus = (memberId, data) => {
    return api.patch(`/api/admin/members/${memberId}/status`, data);
};

// 관리자 커뮤니티 게시글 목록 조회
export const getAdminCommunityPosts = (params) => {
    return api.get("/api/admin/community/posts", { params });
};

// 관리자 커뮤니티 게시글 삭제
export const deleteAdminCommunityPost = (communityPostId) => {
    return api.delete(`/api/admin/community/posts/${communityPostId}`);
};

// 관리자 댓글 목록 조회
export const getAdminCommunityComments = (params) => {
    return api.get("/api/admin/community/comments", { params });
};

// 관리자 댓글 삭제
export const deleteAdminCommunityComment = (commentId) => {
    return api.delete(`/api/admin/community/comments/${commentId}`);
};
