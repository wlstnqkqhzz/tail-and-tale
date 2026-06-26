// 홈 페이지 표시 유틸

export function getParticipantScore(schedule) {
    return (
        (schedule.currentParticipantCount ?? 0)
        + (schedule.approvedParticipantCount ?? 0)
        + ((schedule.pendingRequestCount ?? 0) * 0.5)
    );
}

export function normalizeRegion(region) {
    return (region || "")
        .replace(/\s/g, "")
        .replace(/특별시|광역시|특별자치시|특별자치도|도|시|군|구|동|읍|면/g, "")
        .toLowerCase();
}

export function isRegionMatched(memberRegion, scheduleRegion) {
    if (!memberRegion || !scheduleRegion) {
        return false;
    }

    return scheduleRegion.includes(memberRegion) || memberRegion.includes(scheduleRegion);
}

export function formatLocalDate(date = new Date()) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

export function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

export function getCommunityCategoryLabel(category) {
    if (category === "NOTICE") return "공지";
    if (category === "WALK_REVIEW") return "산책 후기";
    if (category === "DAILY") return "일상";
    if (category === "FREE_TALK") return "잡담";
    if (category === "INFO") return "정보";
    if (category === "QUESTION") return "질문";
    return category || "게시글";
}
