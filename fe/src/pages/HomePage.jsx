import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { getAccessToken } from "../utils/token";
import { getWalkSchedules } from "../api/walk";
import { formatDateTime, formatDogSize } from "../utils/walkFormat";

// 메인 랜딩 페이지

const carouselPanels = [
    {
        type: "promo",
    },
    {
        type: "story",
        title: "남강공원 저녁 산책",
        subtitle: "잔잔한 강변길에서 천천히 걷는 45분 코스",
        region: "경남 진주",
        time: "오늘 19:00",
    },
    {
        type: "book",
        title: "초전공원 소형견 모임",
        subtitle: "낯가림 적은 친구들과 가볍게 인사해요",
        region: "진주 초전동",
        time: "내일 10:30",
    },
    {
        type: "photo",
        title: "비 오는 날 실내 케어",
        subtitle: "산책 대신 컨디션 기록과 건강 루틴을 정리해요",
        region: "온라인",
        time: "이번 주",
    },
    {
        type: "story",
        title: "주말 메이트 모집",
        subtitle: "공원에서 천천히 걷고 사진도 남겨요",
        region: "진주 평거동",
        time: "토요일 16:00",
    },
    {
        type: "book",
        title: "강변 코스 산책",
        subtitle: "낯선 친구와도 부담 없이 걷는 코스",
        region: "남강 산책로",
        time: "일요일 09:30",
    },
];

const keywords = [
    "오늘 산책",
    "진주 산책",
    "소형견 모임",
    "중형견 친구",
    "대형견 산책",
    "강변 코스",
    "공원 산책",
    "저녁 산책",
    "주말 메이트",
    "낯가림 적음",
    "활발한 친구",
    "천천히 걷기",
    "인증 반려견",
    "산책 일기",
    "건강 기록",
    "감정 다이어리",
    "초보 집사",
    "반려견 케어",
    "동네 친구",
    "산책 루틴",
    "지역 산책",
    "긴 산책",
    "사진 남기기",
    "우리집 반려동물",
];

const carouselPanelWidth = 480;
const visiblePanelCount = 3;
const heroImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

export default function HomePage() {
    const navigate = useNavigate();
    const { isLoading, isLoggedIn, member } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [walkSchedules, setWalkSchedules] = useState([]);
    const [isWalkLoading, setIsWalkLoading] = useState(false);

    const maxSlideIndex = Math.max(carouselPanels.length - visiblePanelCount, 0);
    const carouselTranslateX = activeSlide * carouselPanelWidth;

    const headlineName = useMemo(() => {
        if (!member?.nickname) {
            return "반려견";
        }

        return `${member.nickname}님`;
    }, [member]);

    const popularWalks = useMemo(() => (
        [...walkSchedules]
            .filter((schedule) => schedule.status === "OPEN")
            .sort((first, second) => getParticipantScore(second) - getParticipantScore(first))
            .slice(0, 3)
    ), [walkSchedules]);

    const regionWalks = useMemo(() => {
        const memberRegion = normalizeRegion(member?.region);

        if (!memberRegion) {
            return [];
        }

        return walkSchedules
            .filter((schedule) => (
                schedule.status === "OPEN"
                && isRegionMatched(memberRegion, normalizeRegion(schedule.region))
            ))
            .slice(0, 3);
    }, [member?.region, walkSchedules]);

    // 로그인 후 메인 추천 산책 조회
    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        let isMounted = true;

        const fetchRecommendedWalks = async () => {
            try {
                setIsWalkLoading(true);

                const response = await getWalkSchedules({ status: "OPEN" });

                if (!isMounted) {
                    return;
                }

                setWalkSchedules(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) {
                    setIsWalkLoading(false);
                }
            }
        };

        fetchRecommendedWalks();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    // 산책 일정 페이지 이동
    const moveToWalks = () => {
        if (!getAccessToken()) {
            setIsModalOpen(true);
            return;
        }

        navigate("/walks");
    };

    // 키워드 검색
    const searchKeyword = (keyword) => {
        navigate(`/walks?keyword=${encodeURIComponent(keyword)}`);
    };

    // 로그인 전 화면
    const renderGuestHome = () => (
        <main className="pt-20">
            <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
                <h1 className="mb-6 text-6xl font-bold text-gray-900">
                    반려견과의 이야기를
                    <br />
                    기록하고 공유하세요
                </h1>

                <p className="max-w-2xl text-lg text-gray-500">
                    산책 기록, 추억, 건강 관리까지.
                    우리 아이의 하루를 따뜻하게 남겨보세요.
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="h-14 rounded-full bg-black px-8 text-sm font-semibold text-white transition hover:opacity-80"
                    >
                        시작하기
                    </button>

                    <button
                        type="button"
                        onClick={moveToWalks}
                        className="h-14 rounded-full border border-gray-300 px-8 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                    >
                        산책 일정 보기
                    </button>
                </div>
            </section>
        </main>
    );

    // 로그인 후 화면
    const renderMemberHome = () => (
        <main className="bg-white pt-20">
            <section className="mx-auto max-w-7xl px-8 pb-10 pt-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-5xl font-semibold leading-tight tracking-normal text-gray-950">
                            오늘의 산책은
                            <br />
                            {headlineName}의 이야기가 되는 공간.
                        </h1>

                        <p className="mt-6 max-w-2xl text-2xl leading-10 text-gray-300">
                            가까운 산책 메이트를 찾아보고,
                            <br />
                            우리 아이에게 맞는 하루의 리듬을 만들어보세요.
                            <br />
                            기록은 쌓이고, 관계는 더 다정해집니다.
                        </p>
                    </div>

                    <div className="text-sm text-gray-500">
                        <span className="mr-2 font-serif italic text-emerald-600">notice</span>
                        산책 메이트 모집과 참여 신청이 열려 있어요
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1500px] px-8">
                <div className="relative mx-auto h-[520px] max-w-[1440px] overflow-hidden bg-gray-100">
                    <div
                        className="flex h-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${carouselTranslateX}px)` }}
                    >
                        {carouselPanels.map((panel, index) => (
                            <CarouselPanel
                                key={`${panel.type}-${index}`}
                                panel={panel}
                                imageUrl={heroImageUrl}
                                onMoveToWalks={moveToWalks}
                            />
                        ))}
                    </div>
                </div>

                <div className="mx-auto mt-8 flex max-w-md items-center gap-5">
                    <span className="w-8 text-right text-xs font-bold text-gray-950">
                        {String(activeSlide + 1).padStart(2, "0")}
                    </span>

                    <input
                        type="range"
                        min="0"
                        max={maxSlideIndex}
                        value={activeSlide}
                        onChange={(event) => setActiveSlide(Number(event.target.value))}
                        className="h-1 flex-1 cursor-pointer accent-black"
                        aria-label="추천 산책 슬라이드"
                    />

                    <span className="w-8 text-xs text-gray-300">
                        {String(maxSlideIndex + 1).padStart(2, "0")}
                    </span>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-6 px-8 py-16 lg:grid-cols-2">
                <HomeWalkSection
                    eyebrow="POPULAR WALK"
                    title="신청이 많은 산책 모집글"
                    description="참여자와 대기 신청이 많은 산책을 먼저 모아봤어요."
                    schedules={popularWalks}
                    isLoading={isWalkLoading}
                    emptyText="아직 신청이 많은 산책 모집글이 없습니다."
                    onMoveToWalks={() => navigate("/walks")}
                    onSelect={(schedule) => navigate(`/walks/${schedule.walkScheduleId}`)}
                />

                <HomeWalkSection
                    eyebrow="NEARBY WALK"
                    title={`${member?.region || "내 지역"} 기반 모집글`}
                    description="내 거주지역과 가까운 산책 모집글을 확인해보세요."
                    schedules={regionWalks}
                    isLoading={isWalkLoading}
                    emptyText="내 지역과 맞는 산책 모집글이 아직 없습니다."
                    onMoveToWalks={() => navigate(member?.region ? `/walks?region=${encodeURIComponent(member.region)}` : "/walks")}
                    onSelect={(schedule) => navigate(`/walks/${schedule.walkScheduleId}`)}
                />
            </section>

            <section className="mx-auto max-w-6xl px-8 py-24">
                <div className="text-center">
                    <p className="text-lg font-bold tracking-[0.55em] text-gray-950">
                        WALK KEYWORD
                    </p>
                    <p className="mt-4 text-sm text-gray-400">
                        키워드로 분류된 다양한 산책 모음
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-2 border border-gray-200 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8">
                    {keywords.map((keyword) => (
                        <button
                            key={keyword}
                            type="button"
                            onClick={() => searchKeyword(keyword)}
                            className="flex aspect-[1.25/1] items-center justify-center border-b border-r border-gray-200 px-3 text-center text-sm leading-6 text-gray-600 transition hover:bg-gray-950 hover:text-white"
                        >
                            {keyword}
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );

    return (
        <>
            <Header onLoginClick={() => setIsModalOpen(true)} />

            {isLoading ? (
                <main className="flex min-h-screen items-center justify-center pt-20 text-sm text-gray-400">
                    불러오는 중...
                </main>
            ) : isLoggedIn ? renderMemberHome() : renderGuestHome()}

            {isModalOpen && (
                <AuthModal
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}

function CarouselPanel({ panel, imageUrl, onMoveToWalks }) {
    if (panel.type === "promo") {
        return (
            <div className="flex h-[520px] w-[480px] shrink-0 flex-col justify-center bg-gray-950 px-16 text-white">
                <p className="text-sm text-gray-400">오늘만 무료</p>
                <h2 className="mt-4 text-4xl font-bold leading-tight tracking-normal">
                    오늘만 무료 ✦
                </h2>
                <p className="mt-4 text-lg font-semibold text-gray-200">
                    남은 시간&nbsp;&nbsp;07:28:51
                </p>

                <div className="mt-10 w-64 bg-emerald-900/80 p-5">
                    <div className="h-28 overflow-hidden bg-emerald-950">
                        <img
                            src={imageUrl}
                            alt="추천 산책"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <p className="mt-3 font-serif text-xs italic text-emerald-100">
                        tail & tale walk
                    </p>
                    <p className="mt-5 text-xl font-bold leading-8">
                        가까운 곳에서 만나는
                        <br />
                        오늘의 산책 메이트
                    </p>
                    <p className="mt-5 text-xs font-semibold text-emerald-100">
                        by Tail & Tale
                    </p>
                </div>
            </div>
        );
    }

    if (panel.type === "story") {
        return (
            <div className="relative h-[520px] w-[480px] shrink-0 overflow-hidden bg-gray-900">
                <img
                    src={imageUrl}
                    alt={panel.title}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute bottom-16 left-12 right-12 text-white">
                    <p className="text-sm text-white/80">오늘 추천 산책</p>
                    <h2 className="mt-5 text-4xl font-bold leading-tight tracking-normal">
                        {panel.title}
                    </h2>
                    <p className="mt-4 text-sm font-medium text-white/90">
                        {panel.subtitle}
                    </p>
                    <button
                        type="button"
                        onClick={onMoveToWalks}
                        className="mt-8 h-12 rounded-full bg-white px-7 text-sm font-bold text-gray-950 transition hover:bg-gray-100"
                    >
                        산책 일정 보러가기
                    </button>
                </div>
            </div>
        );
    }

    if (panel.type === "book") {
        return (
            <div className="flex h-[520px] w-[480px] shrink-0 flex-col items-center justify-center bg-gray-100 px-12">
                <div className="h-[330px] w-56 overflow-hidden rounded bg-white shadow-2xl">
                    <div className="h-44 overflow-hidden">
                        <img
                            src={imageUrl}
                            alt={panel.title}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="px-5 py-6">
                        <h2 className="text-xl font-bold leading-7 text-gray-950">
                            {panel.title}
                        </h2>
                        <p className="mt-5 text-xs text-gray-400">{panel.region}</p>
                    </div>
                </div>

                <p className="mt-10 text-center text-sm text-gray-500">
                    Featured Walk
                    <br />
                    {panel.time}
                </p>
            </div>
        );
    }

    return (
        <div className="relative h-[520px] w-[480px] shrink-0 overflow-hidden bg-gray-900">
            <img
                src={imageUrl}
                alt={panel.title}
                className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-12 left-10 right-10 text-white">
                <p className="text-sm text-white/70">{panel.region}</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-normal">
                    {panel.title}
                </h2>
                <p className="mt-4 text-sm text-white/85">{panel.subtitle}</p>
                <p className="mt-6 text-xs font-semibold text-white/70">{panel.time}</p>
            </div>
        </div>
    );
}

function HomeWalkSection({
    eyebrow,
    title,
    description,
    schedules,
    isLoading,
    emptyText,
    onMoveToWalks,
    onSelect,
}) {
    return (
        <div className="border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">{eyebrow}</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={onMoveToWalks}
                    className="h-10 shrink-0 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                >
                    더보기
                </button>
            </div>

            <div className="mt-6 grid gap-3">
                {isLoading ? (
                    <div className="flex h-48 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                        추천 산책을 불러오는 중...
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="flex h-48 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                        {emptyText}
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <HomeWalkCard
                            key={schedule.walkScheduleId}
                            schedule={schedule}
                            onClick={() => onSelect(schedule)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function HomeWalkCard({ schedule, onClick }) {
    const currentCount = schedule.currentParticipantCount ?? schedule.approvedParticipantCount ?? 0;
    const pendingCount = schedule.pendingRequestCount ?? 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className="grid gap-4 border border-gray-100 p-5 text-left transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]"
        >
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                        모집 중
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                        {formatDogSize(schedule.preferredDogSize)}
                    </span>
                </div>
                <h3 className="mt-3 line-clamp-1 text-lg font-bold text-gray-950">{schedule.title}</h3>
                <p className="mt-2 line-clamp-1 text-sm text-gray-500">{schedule.description || "등록된 설명이 없습니다."}</p>
                <div className="mt-4 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
                    <span>{schedule.region || "지역 미입력"}</span>
                    <span>{formatDateTime(schedule.scheduledAt)}</span>
                </div>
            </div>

            <div className="flex items-end justify-between gap-4 border-t border-gray-100 pt-4 md:block md:min-w-24 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <div>
                    <p className="text-xs font-bold text-gray-400">참여</p>
                    <p className="mt-1 text-lg font-bold text-gray-950">
                        {currentCount}/{schedule.maxParticipants ?? "-"}명
                    </p>
                </div>
                <div className="md:mt-4">
                    <p className="text-xs font-bold text-gray-400">대기</p>
                    <p className="mt-1 text-lg font-bold text-gray-950">{pendingCount}건</p>
                </div>
            </div>
        </button>
    );
}

function getParticipantScore(schedule) {
    return (
        (schedule.currentParticipantCount ?? 0)
        + (schedule.approvedParticipantCount ?? 0)
        + ((schedule.pendingRequestCount ?? 0) * 0.5)
    );
}

function normalizeRegion(region) {
    return (region || "")
        .replace(/\s/g, "")
        .replace(/특별시|광역시|특별자치시|특별자치도|도|시|군|구|동|읍|면/g, "")
        .toLowerCase();
}

function isRegionMatched(memberRegion, scheduleRegion) {
    if (!memberRegion || !scheduleRegion) {
        return false;
    }

    return scheduleRegion.includes(memberRegion) || memberRegion.includes(scheduleRegion);
}
