import api from "./axios";

// 커뮤니티 게시글 생성
export const createCommunityPost = (data) => {
    return api.post("/api/community/posts", data);
};

// 커뮤니티 게시글 이미지 업로드
export const uploadCommunityPostImage = (formData) => {
    return api.post("/api/community/posts/images", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// 커뮤니티 게시글 목록 조회
export const getCommunityPosts = (params) => {
    return api.get("/api/community/posts", { params });
};

// 커뮤니티 게시글 상세 조회
export const getCommunityPost = (communityPostId) => {
    return api.get(`/api/community/posts/${communityPostId}`);
};

// 커뮤니티 게시글 수정
export const updateCommunityPost = (communityPostId, data) => {
    return api.patch(`/api/community/posts/${communityPostId}`, data);
};

// 커뮤니티 게시글 삭제
export const deleteCommunityPost = (communityPostId) => {
    return api.delete(`/api/community/posts/${communityPostId}`);
};

// 커뮤니티 게시글 좋아요 토글
export const toggleCommunityPostLike = (communityPostId) => {
    return api.post(`/api/community/posts/${communityPostId}/likes`);
};

// 커뮤니티 댓글 목록 조회
export const getCommunityComments = (communityPostId, params) => {
    return api.get(`/api/community/posts/${communityPostId}/comments`, { params });
};

// 커뮤니티 댓글 작성
export const createCommunityComment = (communityPostId, data) => {
    return api.post(`/api/community/posts/${communityPostId}/comments`, data);
};

// 커뮤니티 댓글 수정
export const updateCommunityComment = (communityPostId, commentId, data) => {
    return api.patch(`/api/community/posts/${communityPostId}/comments/${commentId}`, data);
};

// 커뮤니티 댓글 삭제
export const deleteCommunityComment = (communityPostId, commentId) => {
    return api.delete(`/api/community/posts/${communityPostId}/comments/${commentId}`);
};
