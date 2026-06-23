// 마이페이지 표시 유틸

export function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

export function renderRating(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
}
