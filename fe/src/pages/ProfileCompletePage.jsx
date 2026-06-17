// 마이페이지 및 내 정보 수정 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { InfoBadge, StatusBadge } from "../components/walk/WalkBadges";
import { updateMyProfile, getMyDashboard } from "../api/member";
import { cancelMyWalkParticipation } from "../api/walk";
import { getAccessToken } from "../utils/token";
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
];

export default function MyPage() {
    const navigate = useNavigate();

    // 마이페이지 데이터 상태
    const [member, setMember] = useState(null);
    const [dogs, setDogs] = useState([]);
    const [myWalks, setMyWalks] = useState([]);
    const [myParticipations, setMyParticipations] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);

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
            <div className="grid grid-cols-2 md:grid-cols-4">
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
                    <input name="region"
                        value={form.region}
                        onChange={onChange}
                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        placeholder="예: 진주"
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
function SummaryGrid({ dogs, myWalks, myParticipations, chatRooms }) {
    const items = [
        { label: "반려견", value: dogs.length },
        { label: "작성 글", value: myWalks.length },
        { label: "참여 신청", value: myParticipations.length },
        { label: "채팅방", value: chatRooms.length },
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <div key={item.label} className="flex h-36 flex-col justify-between border border-gray-200 p-5">
                    <p className="text-sm font-bold text-gray-400">{item.label}</p>
                    <p className="text-4xl font-bold leading-none text-gray-950">{item.value}</p>
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
