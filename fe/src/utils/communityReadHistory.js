// 커뮤니티 게시글 읽음 기록 유틸

import { getAccessTokenMemberId } from "./token";

const STORAGE_KEY_PREFIX = "communityReadPosts";
const MAX_HISTORY_SIZE = 500;

const getStorageKey = () => {
    const memberId = getAccessTokenMemberId();
    return memberId ? `${STORAGE_KEY_PREFIX}:${memberId}` : null;
};

// 로그인 회원의 읽은 게시글 ID 목록 조회
export const getReadCommunityPostIds = () => {
    const storageKey = getStorageKey();

    if (!storageKey) {
        return new Set();
    }

    try {
        const storedIds = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return new Set(Array.isArray(storedIds) ? storedIds.map(String) : []);
    } catch {
        return new Set();
    }
};

// 게시글 상세 조회 완료 시 읽음 기록 저장
export const markCommunityPostAsRead = (communityPostId) => {
    const storageKey = getStorageKey();

    if (!storageKey || !communityPostId) {
        return;
    }

    const readPostIds = getReadCommunityPostIds();
    readPostIds.delete(String(communityPostId));
    readPostIds.add(String(communityPostId));

    localStorage.setItem(
        storageKey,
        JSON.stringify([...readPostIds].slice(-MAX_HISTORY_SIZE)),
    );
};
