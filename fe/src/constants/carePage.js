// 케어 페이지 상수

export const today = new Date().toISOString().slice(0, 10);

export const initialEmotionForm = {
    dogId: "",
    walkRecordId: "",
    recordedDate: today,
    emotion: "UNKNOWN",
    conditionLevel: "3",
    behaviorPattern: "",
    diaryContent: "",
};

export const initialWalkForm = {
    dogId: "",
    startedAt: `${today}T19:00`,
    endedAt: "",
    durationMinutes: "",
    distanceKm: "",
    routeSummary: "",
    memo: "",
    conditionAfterWalk: "NORMAL",
};

export const initialHealthForm = {
    dogId: "",
    recordedDate: today,
    weight: "",
    healthStatus: "NORMAL",
    symptoms: "",
    memo: "",
};

export const initialQuickRecordForm = {
    hasWalk: "yes",
    durationMinutes: "45",
    distanceKm: "",
    conditionAfterWalk: "GOOD",
    emotion: "HAPPY",
    conditionLevel: "5",
    behaviorPattern: "",
    diaryContent: "",
    weight: "",
    healthStatus: "GOOD",
    symptoms: "",
    memo: "",
};

export const quickSteps = [
    { key: "walk", label: "산책" },
    { key: "emotion", label: "감정" },
    { key: "health", label: "건강" },
];

export const quickEmotionOptions = [
    { value: "SAD", label: "슬픔", conditionLevel: "1" },
    { value: "UNKNOWN", label: "보통", conditionLevel: "2" },
    { value: "CALM", label: "평온함", conditionLevel: "3" },
    { value: "HAPPY", label: "좋음", conditionLevel: "4" },
    { value: "EXCITED", label: "신남", conditionLevel: "5" },
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

export const riskLabels = {
    LOW: "낮음",
    MEDIUM: "보통",
    HIGH: "높음",
};

export const tabs = [
    {
        key: "walk",
        step: "01",
        label: "산책 기록",
        description: "시간, 거리, 산책 후 상태를 먼저 남겨요.",
    },
    {
        key: "emotion",
        step: "02",
        label: "감정 일기",
        description: "산책 후 감정과 행동 변화를 이어서 적어요.",
    },
    {
        key: "health",
        step: "03",
        label: "건강 체크",
        description: "몸무게와 증상, 건강 상태를 하루 단위로 확인해요.",
    },
    {
        key: "analysis",
        step: "04",
        label: "AI 분석",
        description: "쌓인 기록을 바탕으로 관리 가이드를 확인해요.",
    },
    {
        key: "review",
        step: "05",
        label: "결산",
        description: "주간, 월간 기록을 달력으로 보고 AI 리뷰를 요청해요.",
    },
];
