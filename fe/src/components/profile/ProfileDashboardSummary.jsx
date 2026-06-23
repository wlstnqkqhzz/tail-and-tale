// 마이페이지 대시보드 요약

import { dashboardTabs } from "../../constants/profileComplete";

export function DashboardTabs({ activeTab, onChange }) {
    return (
        <div className="border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
                {dashboardTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChange(tab.key)}
                        className={`h-14 border-b-2 text-sm font-bold transition ${
                            activeTab === tab.key
                                ? "border-black text-black"
                                : "border-transparent text-gray-400 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// 내 정보 수정 폼

export function SummaryGrid({
    dogs = [],
    myWalks = [],
    chatRooms = [],
    walkRecords = [],
    emotionDiaries = [],
    healthRecords = [],
    aiAnalyses = [],
    communityPosts = [],
}) {
    const careCount = walkRecords.length + emotionDiaries.length + healthRecords.length + aiAnalyses.length;
    const items = [
        { label: "반려견", value: dogs.length },
        { label: "작성 글", value: myWalks.length },
        { label: "커뮤니티", value: communityPosts.length },
        { label: "채팅방", value: chatRooms.length },
        { label: "케어", value: careCount },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {items.map((item) => (
                <div key={item.label} className="flex h-36 flex-col items-center justify-between border border-gray-200 p-5">
                    <p className="w-full text-center whitespace-nowrap text-xs font-bold text-gray-400 2xl:text-sm">{item.label}</p>
                    <p className="text-5xl font-bold leading-none text-gray-950">{item.value}</p>
                </div>
            ))}
        </div>
    );
}

// 대시보드 영역
