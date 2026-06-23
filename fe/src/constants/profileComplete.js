// 마이페이지 상수

export const initialForm = {
    realName: "",
    nickname: "",
    phoneNumber: "",
    region: "",
    introduction: "",
};

export const dashboardTabs = [
    { key: "dogs", label: "내 반려견" },
    { key: "walks", label: "작성 글" },
    { key: "participations", label: "참여 신청" },
    { key: "chats", label: "채팅방" },
    { key: "community", label: "커뮤니티" },
    { key: "reviews", label: "산책 후기" },
    { key: "care", label: "케어" },
    { key: "settings", label: "설정" },
];

export const emotionLabels = {
    HAPPY: "기분 좋음",
    CALM: "평온함",
    EXCITED: "흥분함",
    ANXIOUS: "불안함",
    SAD: "슬픔",
    ANGRY: "예민함",
    TIRED: "피곤함",
    UNKNOWN: "알 수 없음",
};

export const healthLabels = {
    VERY_GOOD: "매우 좋음",
    GOOD: "좋음",
    NORMAL: "보통",
    WATCH: "관찰 필요",
    BAD: "나쁨",
};

export const conditionAfterWalkLabels = {
    VERY_GOOD: "매우 좋음",
    GOOD: "좋음",
    NORMAL: "보통",
    TIRED: "피곤함",
    BAD: "나쁨",
};

export const analysisLabels = {
    WALK_ACTIVITY: "산책 활동 분석",
    EMOTION_PATTERN: "감정 패턴 분석",
    HEALTH_RISK: "건강 위험 분석",
    CARE_GUIDE: "맞춤 관리 가이드",
};

export const notificationSettingLabels = {
    ALL: "전체 알림",
    WALK_REQUESTED: "산책 신청",
    WALK_APPROVED: "산책 승인",
    WALK_REJECTED: "산책 거절",
    WALK_CANCELED: "산책 취소",
    CHAT_MESSAGE: "채팅 메시지",
    BADGE_EARNED: "뱃지 획득",
};
