// 마이페이지 및 내 정보 수정 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import RegionSelect from "../components/common/RegionSelect";
import { InfoBadge, StatusBadge } from "../components/walk/WalkBadges";
import { updateMyProfile, getMyDashboard } from "../api/member";
import { cancelMyWalkParticipation } from "../api/walk";
import { getAccessToken } from "../utils/token";
import { isCompleteRegionValue } from "../constants/regions";
import { formatDateTime, formatDogSize, formatParticipantStatus } from "../utils/walkFormat";

const initialForm = {
    realName: "",
    nickname: "",
    phoneNumber: "",
    region: "",
    introduction: "",
};

const dashboardTabs = [
    { key: "dogs", label: "내 반려견" },
    { key: "walks", label: "작성 글" },
    { key: "participations", label: "참여 신청" },
    { key: "chats", label: "채팅방" },
    { key: "community", label: "커뮤니티" },
    { key: "reviews", label: "산책 후기" },
    { key: "walkRecords", label: "산책 기록" },
    { key: "emotions", label: "감정 일기" },
    { key: "health", label: "건강 체크" },
    { key: "analysis", label: "AI 분석" },
];

const emotionLabels = {
    HAPPY: "기분 좋음",
    CALM: "평온함",
    EXCITED: "흥분함",
    ANXIOUS: "불안함",
    SAD: "슬픔",
    ANGRY: "예민함",
    TIRED: "피곤함",
    UNKNOWN: "알 수 없음",
};

const healthLabels = {
    VERY_GOOD: "매우 좋음",
    GOOD: "좋음",
    NORMAL: "보통",
    WATCH: "관찰 필요",
    BAD: "나쁨",
};

const conditionAfterWalkLabels = {
    VERY_GOOD: "매우 좋음",
    GOOD: "좋음",
    NORMAL: "보통",
    TIRED: "피곤함",
    BAD: "나쁨",
};

const analysisLabels = {
    WALK_ACTIVITY: "산책 활동 분석",
    EMOTION_PATTERN: "감정 패턴 분석",
    HEALTH_RISK: "건강 위험 분석",
    CARE_GUIDE: "맞춤 관리 가이드",
};

export default function MyPage() {
    const navigate = useNavigate();

    // 마이페이지 데이터 상태
    const [member, setMember] = useState(null);
    const [dogs, setDogs] = useState([]);
    const [myWalks, setMyWalks] = useState([]);
    const [myParticipations, setMyParticipations] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [writtenReviews, setWrittenReviews] = useState([]);
    const [receivedReviews, setReceivedReviews] = useState([]);
    const [walkRecords, setWalkRecords] = useState([]);
    const [emotionDiaries, setEmotionDiaries] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [aiAnalyses, setAiAnalyses] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [communityComments, setCommunityComments] = useState([]);

    // 입력 폼 상태
    const [form, setForm] = useState(initialForm);
    const [activeDashboardTab, setActiveDashboardTab] = useState("dogs");

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 마이페이지 데이터 조회
    const fetchMyPageData = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getMyDashboard();
            const dashboard = response.data;
            const nextMember = dashboard.member;

            setMember(nextMember);
            setDogs(dashboard.dogs);
            setMyWalks(dashboard.myWalkSchedules);
            setMyParticipations(dashboard.myParticipations);
            setChatRooms(dashboard.chatRooms);
            setWrittenReviews(dashboard.writtenReviews || []);
            setReceivedReviews(dashboard.receivedReviews || []);
            setWalkRecords(dashboard.walkRecords || []);
            setEmotionDiaries(dashboard.emotionDiaries || []);
            setHealthRecords(dashboard.healthRecords || []);
            setAiAnalyses(dashboard.aiAnalyses || []);
            setCommunityPosts(dashboard.communityPosts || []);
            setCommunityComments(dashboard.communityComments || []);
            setForm({
                realName: nextMember.realName || "",
                nickname: nextMember.nickname || "",
                phoneNumber: nextMember.phoneNumber || "",
                region: nextMember.region || "",
                introduction: nextMember.introduction || "",
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "마이페이지 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            fetchMyPageData();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchMyPageData, navigate]);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 내 참여 신청 취소
    const handleCancelParticipation = async (walkScheduleId) => {
        if (!window.confirm("산책 참여 신청을 취소할까요?")) {
            return;
        }

        try {
            await cancelMyWalkParticipation(walkScheduleId);

            alert("산책 참여 신청이 취소되었습니다.");
            await fetchMyPageData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 참여 신청 취소에 실패했습니다.");
        }
    };

    // 내 정보 저장
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        if (form.region.trim() && !isCompleteRegionValue(form.region)) {
            alert("거주 지역은 시/도와 시/군/구를 모두 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await updateMyProfile({
                nickname: form.nickname.trim(),
                phoneNumber: form.phoneNumber.trim(),
                region: form.region.trim(),
                introduction: form.introduction.trim(),
            });

            alert("내 정보가 저장되었습니다.");
            await fetchMyPageData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "내 정보 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 케어 페이지 이동
    const moveCarePage = (tab, dogId) => {
        const params = new URLSearchParams({ tab });

        if (dogId) {
            params.set("dogId", String(dogId));
        }

        navigate(`/care?${params.toString()}`);
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            MY PAGE
                        </p>
                        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-5xl font-bold leading-tight text-gray-950">
                                    내 활동과 정보를
                                    <br />
                                    한 곳에서 관리하세요
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                    내 반려견, 작성한 산책 글, 참여 신청, 채팅방을 빠르게 확인할 수 있습니다.
                                </p>
                            </div>

                            {member && (
                                <div className="grid min-w-64 gap-2 border border-gray-200 p-5">
                                    <p className="text-sm font-bold text-gray-400">로그인 회원</p>
                                    <p className="text-2xl font-bold text-gray-950">{member.nickname}님</p>
                                    <p className="truncate text-sm text-gray-500">{member.email}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        마이페이지 정보를 불러오는 중...
                    </div>
                ) : (
                    <section className="mx-auto grid max-w-7xl gap-10 px-8 py-12 xl:grid-cols-[420px_1fr]">
                        <ProfileForm
                            form={form}
                            isSubmitting={isSubmitting}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                        />

                        <div className="grid gap-8">
                            <SummaryGrid
                                dogs={dogs}
                                myWalks={myWalks}
                                myParticipations={myParticipations}
                                chatRooms={chatRooms}
                                writtenReviews={writtenReviews}
                                receivedReviews={receivedReviews}
                                walkRecords={walkRecords}
                                emotionDiaries={emotionDiaries}
                                healthRecords={healthRecords}
                                aiAnalyses={aiAnalyses}
                                communityPosts={communityPosts}
                            />

                            <DashboardTabs
                                activeTab={activeDashboardTab}
                                onChange={setActiveDashboardTab}
                            />

                            {activeDashboardTab === "dogs" && (
                                <DashboardSection
                                    title="내 반려견"
                                    count={dogs.length}
                                    emptyText="등록된 반려견이 없습니다."
                                    actionLabel="반려견 관리"
                                    onAction={() => navigate("/dogs")}
                                >
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {dogs.slice(0, 4).map((dog) => (
                                            <DogCard key={dog.dogId} dog={dog} onClick={() => navigate("/dogs")} />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "walks" && (
                                <DashboardSection
                                    title="내가 쓴 산책 글"
                                    count={myWalks.length}
                                    emptyText="작성한 산책 글이 없습니다."
                                    actionLabel="산책 글 작성"
                                    onAction={() => navigate("/walks/new")}
                                >
                                    <div className="grid gap-3">
                                        {myWalks.slice(0, 4).map((schedule) => (
                                            <WalkRow
                                                key={schedule.walkScheduleId}
                                                schedule={schedule}
                                                onClick={() => navigate(`/walks/${schedule.walkScheduleId}`)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "participations" && (
                                <DashboardSection
                                    title="내 참여 신청"
                                    count={myParticipations.length}
                                    emptyText="참여 신청한 산책이 없습니다."
                                    actionLabel="산책 둘러보기"
                                    onAction={() => navigate("/walks")}
                                >
                                    <div className="grid gap-3">
                                        {myParticipations.slice(0, 4).map((schedule) => (
                                            <WalkRow
                                                key={schedule.walkScheduleId}
                                                participation={schedule}
                                                showParticipantStatus
                                                onClick={() => navigate(`/walks/${schedule.walkScheduleId}`)}
                                                onCancel={() => handleCancelParticipation(schedule.walkScheduleId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "chats" && (
                                <DashboardSection
                                    title="내 채팅창"
                                    count={chatRooms.length}
                                    emptyText="입장 가능한 채팅방이 없습니다."
                                    actionLabel="채팅 목록"
                                    onAction={() => navigate("/chat/rooms")}
                                >
                                    <div className="grid gap-3">
                                        {chatRooms.slice(0, 4).map((chatRoom) => (
                                            <ChatRoomRow
                                                key={chatRoom.chatRoomId}
                                                chatRoom={chatRoom}
                                                onClick={() => navigate(`/chat/rooms/${chatRoom.chatRoomId}`, {
                                                    state: {
                                                        walkTitle: chatRoom.walkTitle,
                                                        walkScheduleId: chatRoom.walkScheduleId,
                                                    },
                                                })}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "community" && (
                                <DashboardSection
                                    title="내 커뮤니티"
                                    count={communityPosts.length + communityComments.length}
                                    emptyText="작성한 커뮤니티 활동이 없습니다."
                                    actionLabel="커뮤니티 보기"
                                    onAction={() => navigate("/community")}
                                >
                                    <div className="grid gap-6">
                                        <CommunityGroup
                                            title="내가 쓴 글"
                                            items={communityPosts}
                                            emptyText="작성한 커뮤니티 글이 없습니다."
                                            type="post"
                                            onClick={(item) => navigate(`/community/${item.communityPostId}`)}
                                        />

                                        <CommunityGroup
                                            title="내가 쓴 댓글"
                                            items={communityComments}
                                            emptyText="작성한 댓글이 없습니다."
                                            type="comment"
                                            onClick={(item) => navigate(`/community/${item.communityPostId}`)}
                                        />
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "walkRecords" && (
                                <DashboardSection
                                    title="최근 산책 기록"
                                    count={walkRecords.length}
                                    emptyText="작성한 산책 기록이 없습니다."
                                    actionLabel="산책 기록 관리"
                                    onAction={() => moveCarePage("walk", walkRecords[0]?.dogId)}
                                >
                                    <div className="grid gap-3">
                                        {walkRecords.slice(0, 4).map((record) => (
                                            <CareRow
                                                key={record.walkRecordId}
                                                title={`${conditionAfterWalkLabels[record.conditionAfterWalk] || "상태 미입력"} · ${record.durationMinutes ? `${record.durationMinutes}분` : "시간 미입력"}`}
                                                meta={`${formatDateOnly(record.startedAt)} · ${record.dogName}`}
                                                content={record.memo || record.routeSummary || "기록된 내용이 없습니다."}
                                                onClick={() => moveCarePage("walk", record.dogId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "emotions" && (
                                <DashboardSection
                                    title="최근 감정 일기"
                                    count={emotionDiaries.length}
                                    emptyText="작성한 감정 일기가 없습니다."
                                    actionLabel="감정 일기 관리"
                                    onAction={() => moveCarePage("emotion", emotionDiaries[0]?.dogId)}
                                >
                                    <div className="grid gap-3">
                                        {emotionDiaries.slice(0, 4).map((diary) => (
                                            <CareRow
                                                key={diary.emotionDiaryId}
                                                title={`${emotionLabels[diary.emotion]} · ${diary.conditionLevel || "-"}점`}
                                                meta={`${diary.recordedDate} · ${diary.dogName}`}
                                                content={diary.diaryContent || diary.behaviorPattern || "기록된 내용이 없습니다."}
                                                onClick={() => moveCarePage("emotion", diary.dogId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "health" && (
                                <DashboardSection
                                    title="최근 건강 체크"
                                    count={healthRecords.length}
                                    emptyText="작성한 건강 기록이 없습니다."
                                    actionLabel="건강 체크 관리"
                                    onAction={() => moveCarePage("health", healthRecords[0]?.dogId)}
                                >
                                    <div className="grid gap-3">
                                        {healthRecords.slice(0, 4).map((record) => (
                                            <CareRow
                                                key={record.healthRecordId}
                                                title={`${healthLabels[record.healthStatus] || "상태 미입력"} · ${record.weight ? `${record.weight}kg` : "몸무게 미입력"}`}
                                                meta={`${record.recordedDate} · ${record.dogName}`}
                                                content={record.memo || record.symptoms || "기록된 내용이 없습니다."}
                                                onClick={() => moveCarePage("health", record.dogId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "analysis" && (
                                <DashboardSection
                                    title="최근 AI 분석"
                                    count={aiAnalyses.length}
                                    emptyText="생성한 AI 분석 결과가 없습니다."
                                    actionLabel="AI 분석 관리"
                                    onAction={() => moveCarePage("analysis", aiAnalyses[0]?.dogId)}
                                >
                                    <div className="grid gap-3">
                                        {aiAnalyses.slice(0, 4).map((analysis) => (
                                            <CareRow
                                                key={analysis.aiAnalysisResultId}
                                                title={analysis.summary}
                                                meta={`${analysisLabels[analysis.analysisType]} · ${analysis.dogName}`}
                                                content={analysis.guideContent || analysis.resultContent}
                                                onClick={() => moveCarePage("analysis", analysis.dogId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}

// 대시보드 탭
function DashboardTabs({ activeTab, onChange }) {
    return (
        <div className="border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10">
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
function ProfileForm({ form, isSubmitting, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
            <div className="mb-6">
                <p className="text-sm font-bold tracking-[0.3em] text-gray-400">PROFILE</p>
                <h2 className="mt-3 text-2xl font-bold text-gray-950">내 정보 수정</h2>
            </div>

            <div className="grid gap-4">
                <Field label="실명">
                    <input name="realName"
                        value={form.realName}
                        disabled
                        className="h-12 border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs font-normal text-gray-400">
                        실명은 가입 후 변경할 수 없습니다.
                    </p>
                </Field>

                <Field label="닉네임">
                    <input name="nickname"
                        value={form.nickname}
                        onChange={onChange}
                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        placeholder="닉네임을 입력해주세요"
                    />
                </Field>

                <Field label="전화번호">
                    <input name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={onChange}
                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        placeholder="01012345678"
                    />
                </Field>

                <Field label="거주 지역">
                    <RegionSelect
                        value={form.region}
                        onChange={(region) => onChange({ target: { name: "region", value: region } })}
                    />
                </Field>

                <Field label="자기소개">
                    <textarea name="introduction"
                        value={form.introduction}
                        onChange={onChange}
                        className="min-h-28 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                        placeholder="간단한 자기소개를 입력해주세요"
                    />
                </Field>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 h-12 w-full bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                {isSubmitting ? "저장 중..." : "정보 저장"}
            </button>
        </form>
    );
}

// 요약 카드 그리드
function SummaryGrid({
    dogs = [],
    myWalks = [],
    chatRooms = [],
    walkRecords = [],
    communityPosts = [],
}) {
    const items = [
        { label: "반려견", value: dogs.length },
        { label: "작성 글", value: myWalks.length },
        { label: "커뮤니티", value: communityPosts.length },
        { label: "채팅방", value: chatRooms.length },
        { label: "산책 기록", value: walkRecords.length },
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
function DashboardSection({ title, count, emptyText, actionLabel, onAction, children }) {
    return (
        <section className="pt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-950">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">총 {count}건</p>
                </div>

                <button type="button"
                    onClick={onAction}
                    className="h-10 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                >
                    {actionLabel}
                </button>
            </div>

            {count === 0 ? (
                <div className="flex h-32 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : children}
        </section>
    );
}

// 반려견 카드
function DogCard({ dog, onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-gray-950">{dog.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{dog.breed || "견종 미입력"}</p>
                </div>
                <InfoBadge label={dog.isVerified ? "인증" : "미인증"} tone={dog.isVerified ? "green" : "amber"} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <MiniInfo label="크기" value={formatDogSize(dog.size)} />
                <MiniInfo label="몸무게" value={dog.weight ? `${dog.weight}kg` : "미입력"} />
            </div>
        </button>
    );
}

// 산책 행
function WalkRow({ schedule, participation, showParticipantStatus = false, onClick, onCancel }) {
    const item = schedule || participation;
    const canCancel = Boolean(participation && ["REQUESTED", "APPROVED"].includes(participation.status));

    return (
        <div className="grid gap-4 border border-gray-200 p-5 transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]">
            <button type="button" onClick={onClick} className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                    {schedule && <StatusBadge status={item.status} />}
                    {showParticipantStatus && (
                        <InfoBadge label={formatParticipantStatus(item.status)} tone="blue" />
                    )}
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-gray-950">{item.title}</h3>
                <p className="mt-1 truncate text-sm text-gray-500">{item.meetingPlace}</p>
            </button>

            <div className="min-w-0">
                <div className="text-sm text-gray-500 md:text-right">
                <p>{formatDateTime(item.scheduledAt)}</p>
                <p className="mt-1 font-semibold text-gray-900">
                    {item.currentParticipantCount}/{item.maxParticipants}명
                </p>
                </div>

                {canCancel && (
                    <button type="button"
                        onClick={onCancel}
                        className="mt-3 h-9 w-full border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50"
                    >
                        신청 취소
                    </button>
                )}
            </div>
        </div>
    );
}

// 채팅방 행
function ChatRoomRow({ chatRoom, onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="grid gap-4 border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]"
        >
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                    <InfoBadge label={chatRoom.myRole === "HOST" ? "호스트" : "참여자"} />
                    <InfoBadge label={chatRoom.status === "ACTIVE" ? "진행 중" : "종료"} tone="green" />
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-gray-950">{chatRoom.walkTitle}</h3>
                <p className="mt-1 truncate text-sm text-gray-500">
                    {chatRoom.lastMessage?.content || "아직 메시지가 없습니다."}
                </p>
            </div>

            <div className="text-sm text-gray-400 md:text-right">
                {chatRoom.lastMessage?.createdAt
                    ? formatDateTime(chatRoom.lastMessage.createdAt)
                    : "새 채팅방"}
            </div>
        </button>
    );
}

// 산책 후기 그룹
function ReviewGroup({ title, reviews, emptyText, onClick }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                <span className="text-sm font-bold text-gray-400">{reviews.length}건</span>
            </div>

            {reviews.length === 0 ? (
                <div className="flex h-24 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-3">
                    {reviews.slice(0, 4).map((review) => (
                        <button
                            key={review.walkReviewId}
                            type="button"
                            onClick={() => onClick(review)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <p className="text-sm font-bold text-gray-400">
                                {review.walkTitle} · {formatDateOnly(review.createdAt)}
                            </p>
                            <h4 className="mt-2 text-lg font-bold text-gray-950">
                                {renderRating(review.rating)} {review.rating}점
                            </h4>
                            <p className="mt-2 text-sm text-gray-500">
                                {review.reviewerNickname} → {review.revieweeNickname}
                            </p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                                {review.content || "후기 내용이 없습니다."}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// 커뮤니티 활동 그룹
function CommunityGroup({ title, items, emptyText, type, onClick }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                <span className="text-sm font-bold text-gray-400">{items.length}건</span>
            </div>

            {items.length === 0 ? (
                <div className="flex h-24 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-3">
                    {items.slice(0, 4).map((item) => (
                        <button
                            key={type === "post" ? item.communityPostId : item.commentId}
                            type="button"
                            onClick={() => onClick(item)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <p className="text-sm font-bold text-gray-400">
                                {formatDateOnly(item.createdAt)}
                            </p>
                            <h4 className="mt-2 line-clamp-1 text-lg font-bold text-gray-950">
                                {type === "post" ? item.title : item.communityPostTitle}
                            </h4>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                                {type === "post" ? `댓글 ${item.commentCount} · 추천 ${item.likeCount}` : item.content}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// 케어 기록 행
function CareRow({ title, meta, content, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
        >
            <p className="text-sm font-bold text-gray-400">{meta}</p>
            <h3 className="mt-2 line-clamp-1 text-lg font-bold text-gray-950">{title}</h3>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{content}</p>
        </button>
    );
}

// 입력 필드
function Field({ label, children }) {
    return (
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}

// 작은 정보
function MiniInfo({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-1 truncate font-semibold text-gray-800">{value || "미입력"}</p>
        </div>
    );
}

function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

function renderRating(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
}
