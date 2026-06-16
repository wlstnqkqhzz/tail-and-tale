// 산책 화면 표시값 변환

export function formatScheduleStatus(status) {
    if (status === "OPEN") return "모집 중";
    if (status === "CLOSED") return "마감";
    if (status === "CANCELED") return "취소";
    if (status === "COMPLETED") return "완료";
    return "알 수 없음";
}

export function formatParticipantStatus(status) {
    if (status === "REQUESTED") return "신청 대기";
    if (status === "APPROVED") return "승인";
    if (status === "REJECTED") return "거절";
    if (status === "CANCELED") return "취소";
    return "신청 전";
}

export function formatDogSize(size) {
    if (size === "ANY") return "크기 무관";
    if (size === "SMALL") return "소형";
    if (size === "MEDIUM") return "중형";
    if (size === "LARGE") return "대형";
    return "미입력";
}

export function formatDateTime(dateTime) {
    if (!dateTime) {
        return "미정";
    }

    return dateTime.replace("T", " ").slice(0, 16);
}
