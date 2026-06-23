// 반려견 표시 유틸

export function resolveImageUrl(imageUrl) {
    if (!imageUrl) {
        return "";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    return `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
}

// 상세 정보 항목
export function formatGender(gender) {
    if (gender === "MALE") return "수컷";
    if (gender === "FEMALE") return "암컷";
    return "모름";
}

// 크기 표시
export function formatSize(size) {
    if (size === "SMALL") return "소형";
    if (size === "MEDIUM") return "중형";
    if (size === "LARGE") return "대형";
    return "미입력";
}

// 날짜 시간 표시
export function formatDateTime(dateTime) {
    if (!dateTime) {
        return "미인증";
    }

    return dateTime.replace("T", " ").slice(0, 16);
}

// 오늘 날짜
export function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}
