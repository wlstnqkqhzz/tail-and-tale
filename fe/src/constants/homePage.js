// 홈 페이지 상수

export const shortcutMenus = [
    { label: "산책 모집", path: "/walks" },
    { label: "커뮤니티", path: "/community" },
    { label: "케어 기록", path: "/care" },
    { label: "AI 결산", path: "/care?tab=review" },
    { label: "인기 산책", path: "/walks?recruitableOnly=true" },
    {
        label: "내 지역",
        getPath: (member) => (member?.region ? `/walks?region=${encodeURIComponent(member.region)}` : "/walks"),
    },
    { label: "인증 반려견", path: "/dogs" },
    { label: "우리 강아지", path: "/dogs" },
    { label: "산책 후기", path: "/community?category=WALK_REVIEW" },
    { label: "감정 일기", path: "/care?tab=emotion" },
    { label: "건강 체크", path: "/care?tab=health" },
    { label: "마이페이지", path: "/profile-complete" },
];
