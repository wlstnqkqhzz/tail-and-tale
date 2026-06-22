import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { getAccessToken } from "../utils/token";
import { getWalkSchedules } from "../api/walk";
import { getDogs } from "../api/dog";
import { getCareSummary } from "../api/care";
import { getCommunityPosts } from "../api/community";
import { getNotifications } from "../api/notification";
import { formatDateTime, formatDogSize } from "../utils/walkFormat";

// 메인 랜딩 페이지

const shortcutMenus = [
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

export default function HomePage() {
    const navigate = useNavigate();
    const { isLoading, isLoggedIn, member } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [walkSchedules, setWalkSchedules] = useState([]);
    const [dogs, setDogs] = useState([]);
    const [careSummary, setCareSummary] = useState(null);
    const [popularPosts, setPopularPosts] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [isHomeDataLoading, setIsHomeDataLoading] = useState(false);
    const [isCareSummaryLoading, setIsCareSummaryLoading] = useState(false);

    const todayDate = useMemo(() => formatLocalDate(), []);

    const headlineName = useMemo(() => {
        if (!member?.nickname) {
            return "반려견";
        }

        return `${member.nickname}님`;
    }, [member]);

    const openWalks = useMemo(() => (
        walkSchedules.filter((schedule) => schedule.status === "OPEN")
    ), [walkSchedules]);

    const popularWalks = useMemo(() => (
        [...openWalks]
            .sort((first, second) => getParticipantScore(second) - getParticipantScore(first))
            .slice(0, 3)
    ), [openWalks]);

    const regionWalks = useMemo(() => {
        const memberRegion = normalizeRegion(member?.region);

        if (!memberRegion) {
            return [];
        }

        return openWalks
            .filter((schedule) => isRegionMatched(memberRegion, normalizeRegion(schedule.region)))
            .slice(0, 3);
    }, [member?.region, openWalks]);

    const featuredWalks = useMemo(() => {
        const seenIds = new Set();

        return [...regionWalks, ...popularWalks, ...openWalks]
            .filter((schedule) => {
                if (seenIds.has(schedule.walkScheduleId)) {
                    return false;
                }

                seenIds.add(schedule.walkScheduleId);
                return true;
            })
            .slice(0, 5);
    }, [openWalks, popularWalks, regionWalks]);

    const primaryDog = useMemo(() => (
        dogs.find((dog) => dog.isVerified) || dogs[0] || null
    ), [dogs]);

    const verifiedDogCount = useMemo(() => (
        dogs.filter((dog) => dog.isVerified).length
    ), [dogs]);

    useEffect(() => {
        const homeSlideCount = 4;

        if (activeSlide >= homeSlideCount) {
            setActiveSlide(0);
        }
    }, [activeSlide]);

    // 로그인 후 홈 화면 데이터 조회
    useEffect(() => {
        if (!isLoggedIn) {
            setWalkSchedules([]);
            setDogs([]);
            setCareSummary(null);
            setPopularPosts([]);
            setUnreadNotificationCount(0);
            return;
        }

        let isMounted = true;

        const fetchHomeData = async () => {
            try {
                setIsHomeDataLoading(true);

                const [walkResponse, dogResponse, postResponse, notificationResponse] = await Promise.all([
                    getWalkSchedules({ status: "OPEN" }),
                    getDogs(),
                    getCommunityPosts({ sort: "likes", size: 5 }),
                    getNotifications(),
                ]);

                if (!isMounted) {
                    return;
                }

                setWalkSchedules(Array.isArray(walkResponse.data) ? walkResponse.data : []);
                setDogs(Array.isArray(dogResponse.data) ? dogResponse.data : []);
                setPopularPosts(postResponse.data?.posts || []);
                setUnreadNotificationCount(notificationResponse.data?.unreadCount || 0);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) {
                    setIsHomeDataLoading(false);
                }
            }
        };

        fetchHomeData();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    // 대표 반려견의 오늘 케어 요약 조회
    useEffect(() => {
        if (!isLoggedIn || !primaryDog?.dogId || !primaryDog.isVerified) {
            setCareSummary(null);
            return;
        }

        let isMounted = true;

        const fetchCareSummary = async () => {
            try {
                setIsCareSummaryLoading(true);

                const response = await getCareSummary({
                    dogId: primaryDog.dogId,
                    startDate: todayDate,
                    endDate: todayDate,
                });

                if (!isMounted) {
                    return;
                }

                setCareSummary(response.data);
            } catch (error) {
                console.error(error);
                if (isMounted) {
                    setCareSummary(null);
                }
            } finally {
                if (isMounted) {
                    setIsCareSummaryLoading(false);
                }
            }
        };

        fetchCareSummary();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn, primaryDog?.dogId, primaryDog?.isVerified, todayDate]);

    // 산책 일정 페이지 이동
    const moveToWalks = () => {
        if (!getAccessToken()) {
            setIsModalOpen(true);
            return;
        }

        navigate("/walks");
    };

    // 메인 바로가기 이동
    const moveToShortcut = (menu) => {
        const path = menu.getPath ? menu.getPath(member) : menu.path;

        navigate(path);
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
            <section className="mx-auto max-w-[1500px] px-8 pb-10 pt-14">
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

                    <div className="shrink-0 pb-1 text-right text-sm text-gray-500">
                        <span className="mr-2 font-serif italic text-emerald-600">notice</span>
                        실제 모집글과 오늘의 기록을 한 번에 확인해보세요
                    </div>
                </div>
            </section>

            <HomeFeatureShowcase
                featuredWalks={featuredWalks}
                popularWalks={popularWalks}
                regionWalks={regionWalks}
                popularPosts={popularPosts}
                primaryDog={primaryDog}
                dogs={dogs}
                verifiedDogCount={verifiedDogCount}
                careSummary={careSummary}
                unreadNotificationCount={unreadNotificationCount}
                activeSlide={activeSlide}
                setActiveSlide={setActiveSlide}
                isLoading={isHomeDataLoading}
                isCareSummaryLoading={isCareSummaryLoading}
                member={member}
                onMoveToWalks={moveToWalks}
                onMoveToCare={() => navigate("/care")}
                onMoveToDogs={() => navigate("/dogs")}
                onMoveToProfile={() => navigate("/profile-complete")}
                onMoveToCommunity={() => navigate("/community")}
                onMoveToNearbyWalks={() => navigate(member?.region ? `/walks?region=${encodeURIComponent(member.region)}` : "/walks")}
                onSelect={(schedule) => navigate(`/walks/${schedule.walkScheduleId}`)}
                onSelectPost={(post) => navigate(`/community/${post.communityPostId}`)}
            />

            <section className="mx-auto max-w-5xl px-8 py-20">
                <div className="text-center">
                    <p className="text-lg font-bold tracking-[0.55em] text-gray-950">
                        QUICK MENU
                    </p>
                    <p className="mt-4 text-sm text-gray-400">
                        자주 쓰는 기능을 빠르게 열어보세요
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-2 border border-gray-200 sm:grid-cols-4">
                    {shortcutMenus.map((menu) => (
                        <button
                            key={menu.label}
                            type="button"
                            onClick={() => moveToShortcut(menu)}
                            className="flex aspect-[2.5/1] items-center justify-center border-b border-r border-gray-200 px-3 text-center text-sm font-medium leading-6 text-gray-600 transition hover:bg-gray-950 hover:text-white"
                        >
                            {menu.label}
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

function HomeFeatureShowcase({
    featuredWalks,
    popularWalks,
    regionWalks,
    popularPosts,
    primaryDog,
    dogs,
    verifiedDogCount,
    careSummary,
    unreadNotificationCount,
    activeSlide,
    setActiveSlide,
    isLoading,
    isCareSummaryLoading,
    member,
    onMoveToWalks,
    onMoveToCare,
    onMoveToDogs,
    onMoveToProfile,
    onMoveToCommunity,
    onMoveToNearbyWalks,
    onSelect,
    onSelectPost,
}) {
    const slides = [
        { key: "walk", label: "추천 산책" },
        { key: "care", label: "오늘 케어" },
        { key: "walks", label: "모집 현황" },
        { key: "community", label: "인기글" },
    ];

    return (
        <section className="mx-auto max-w-[1500px] px-8">
            <div className="mx-auto max-w-[1440px] overflow-hidden border border-gray-200 bg-white">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{
                        width: `${slides.length * 100}%`,
                        transform: `translateX(-${activeSlide * (100 / slides.length)}%)`,
                    }}
                >
                    <FeatureSlide slideCount={slides.length}>
                        <WalkFeatureSlide
                            walks={featuredWalks}
                            isLoading={isLoading}
                            onMoveToWalks={onMoveToWalks}
                            onSelect={onSelect}
                        />
                    </FeatureSlide>

                    <FeatureSlide slideCount={slides.length}>
                        <div className="grid h-full gap-6 p-8 lg:grid-cols-3">
                            <TodayCareCard
                                dog={primaryDog}
                                summary={careSummary}
                                isLoading={isCareSummaryLoading}
                                onMoveToCare={onMoveToCare}
                                onMoveToDogs={onMoveToDogs}
                            />

                            <DogSummaryCard
                                dogs={dogs}
                                primaryDog={primaryDog}
                                verifiedDogCount={verifiedDogCount}
                                onMoveToDogs={onMoveToDogs}
                            />

                            <NotificationSummaryCard
                                unreadCount={unreadNotificationCount}
                                onMoveToNotifications={onMoveToProfile}
                            />
                        </div>
                    </FeatureSlide>

                    <FeatureSlide slideCount={slides.length}>
                        <div className="grid h-full gap-6 p-8 lg:grid-cols-2">
                            <HomeWalkSection
                                eyebrow="POPULAR WALK"
                                title="신청이 많은 산책 모집글"
                                description="참여자와 대기 신청이 많은 산책을 먼저 모아봤어요."
                                schedules={popularWalks.slice(0, 2)}
                                isLoading={isLoading}
                                emptyText="아직 신청이 많은 산책 모집글이 없습니다."
                                onMoveToWalks={onMoveToWalks}
                                onSelect={onSelect}
                            />

                            <HomeWalkSection
                                eyebrow="NEARBY WALK"
                                title={`${member?.region || "내 지역"} 기반 모집글`}
                                description="내 거주지역과 가까운 산책 모집글을 확인해보세요."
                                schedules={regionWalks.slice(0, 2)}
                                isLoading={isLoading}
                                emptyText="내 지역과 맞는 산책 모집글이 아직 없습니다."
                                onMoveToWalks={onMoveToNearbyWalks}
                                onSelect={onSelect}
                            />
                        </div>
                    </FeatureSlide>

                    <FeatureSlide slideCount={slides.length}>
                        <CommunityPopularSlide
                            posts={popularPosts}
                            isLoading={isLoading}
                            onMoveToCommunity={onMoveToCommunity}
                            onSelect={onSelectPost}
                        />
                    </FeatureSlide>
                </div>
            </div>

            <div className="mx-auto mt-8 flex max-w-md items-center gap-5">
                <span className="w-8 text-right text-xs font-bold text-gray-950">
                    {String(activeSlide + 1).padStart(2, "0")}
                </span>

                <input
                    type="range"
                    min="0"
                    max={slides.length - 1}
                    value={activeSlide}
                    onChange={(event) => setActiveSlide(Number(event.target.value))}
                    className="h-1 flex-1 cursor-pointer accent-black"
                    aria-label="메인 홈 슬라이드"
                />

                <span className="w-8 text-xs text-gray-300">
                    {String(slides.length).padStart(2, "0")}
                </span>
            </div>

            <div className="mt-4 flex justify-center gap-2">
                {slides.map((slide, index) => (
                    <button
                        key={slide.key}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`h-9 border px-4 text-xs font-bold transition ${
                            activeSlide === index
                                ? "border-gray-950 bg-gray-950 text-white"
                                : "border-gray-200 text-gray-400 hover:border-gray-950 hover:text-gray-950"
                        }`}
                    >
                        {slide.label}
                    </button>
                ))}
            </div>
        </section>
    );
}

function FeatureSlide({ children, slideCount }) {
    return (
        <div className="h-[520px] shrink-0 overflow-hidden" style={{ width: `${100 / slideCount}%` }}>
            {children}
        </div>
    );
}

function WalkFeatureSlide({ walks, isLoading, onMoveToWalks, onSelect }) {
    const visiblePanelCount = 3;
    const visibleWalks = walks.slice(0, visiblePanelCount);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                추천 산책을 불러오는 중...
            </div>
        );
    }

    if (visibleWalks.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">TODAY WALK</p>
                <h2 className="text-3xl font-bold text-gray-950">아직 추천할 산책 모집글이 없어요.</h2>
                <p className="text-sm text-gray-500">첫 산책 모집글을 작성하거나 전체 산책 목록을 둘러보세요.</p>
                <button
                    type="button"
                    onClick={onMoveToWalks}
                    className="h-12 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:opacity-80"
                >
                    산책 게시판 보기
                </button>
            </div>
        );
    }

    return (
        <div className="grid h-full lg:grid-cols-3">
            {visibleWalks.map((walk, index) => (
                <WalkCarouselPanel
                    key={walk.walkScheduleId}
                    walk={walk}
                    index={index}
                    onClick={() => onSelect(walk)}
                />
            ))}

            {visibleWalks.length < visiblePanelCount && Array.from({ length: visiblePanelCount - visibleWalks.length }).map((_, index) => (
                <div
                    key={`empty-panel-${index}`}
                    className="flex h-full flex-col justify-center bg-gray-50 px-12"
                >
                    <p className="text-xs font-bold tracking-[0.35em] text-gray-300">NEXT WALK</p>
                    <h3 className="mt-5 text-3xl font-bold leading-tight text-gray-300">
                        새로운 산책 모집글을
                        <br/>
                        기다리고 있어요.
                    </h3>
                </div>
            ))}
        </div>
    );
}

function WalkCarouselPanel({ walk, index, onClick }) {
    const currentCount = walk.currentParticipantCount ?? walk.approvedParticipantCount ?? 0;
    const pendingCount = walk.pendingRequestCount ?? 0;
    const isPrimary = index % 3 === 0;
    const isSoft = index % 3 === 2;

    if (isPrimary) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="flex h-full w-full flex-col justify-center bg-gray-950 px-16 text-left text-white transition hover:bg-black"
            >
                <p className="text-sm text-gray-400">오늘 추천 산책</p>
                <h2 className="mt-5 text-4xl font-bold leading-tight tracking-normal">
                    {walk.title}
                </h2>
                <p className="mt-5 line-clamp-3 text-sm leading-7 text-gray-300">
                    {walk.description || "산책 메이트와 함께할 일정을 확인해보세요."}
                </p>

                <div className="mt-10 bg-emerald-900/80 p-5">
                    <p className="font-serif text-xs italic text-emerald-100">tail & tale walk</p>
                    <p className="mt-5 text-xl font-bold leading-8">
                        가까운 곳에서 만나는
                        <br />
                        오늘의 산책 메이트
                    </p>
                    <p className="mt-5 text-xs font-semibold text-emerald-100">
                        {walk.region || "지역 미입력"} · {formatDateTime(walk.scheduledAt)}
                    </p>
                </div>
            </button>
        );
    }

    if (isSoft) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="flex h-full w-full flex-col items-center justify-center bg-gray-50 px-12 text-center transition hover:bg-gray-100"
            >
                <div className="w-72 border border-gray-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">FEATURED</p>
                    <h2 className="mt-6 text-2xl font-bold leading-9 text-gray-950">
                        {walk.title}
                    </h2>
                    <p className="mt-5 line-clamp-2 text-sm leading-6 text-gray-500">
                        {walk.description || "등록된 설명이 없습니다."}
                    </p>
                    <div className="mt-8 border-t border-gray-100 pt-5 text-sm text-gray-400">
                        {walk.region || "지역 미입력"}
                        <br />
                        {formatDateTime(walk.scheduledAt)}
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-full w-full flex-col justify-end bg-white px-12 py-14 text-left transition hover:bg-gray-50"
        >
            <div>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                        모집 중
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                        {formatDogSize(walk.preferredDogSize)}
                    </span>
                </div>

                <h2 className="mt-7 text-4xl font-bold leading-tight tracking-normal text-gray-950">
                    {walk.title}
                </h2>

                <p className="mt-5 line-clamp-2 text-sm leading-7 text-gray-500">
                    {walk.description || "등록된 설명이 없습니다."}
                </p>

                <div className="mt-10 grid grid-cols-2 border-t border-gray-200 pt-6 text-sm">
                    <div>
                        <p className="font-bold text-gray-400">지역</p>
                        <p className="mt-2 font-bold text-gray-950">{walk.region || "미입력"}</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-400">참여</p>
                        <p className="mt-2 font-bold text-gray-950">
                            {currentCount}/{walk.maxParticipants ?? "-"}명
                            {pendingCount > 0 ? ` · 대기 ${pendingCount}` : ""}
                        </p>
                    </div>
                </div>

                <span className="mt-10 inline-flex h-12 items-center rounded-full bg-gray-950 px-7 text-sm font-bold text-white">
                    상세 보기
                </span>
            </div>
        </button>
    );
}

function TodayCareCard({ dog, summary, isLoading, onMoveToCare, onMoveToDogs }) {
    const walkCount = summary?.walkSummary?.totalCount ?? 0;
    const emotionCount = summary?.emotionSummary?.totalCount ?? 0;
    const healthCount = summary?.healthSummary?.totalCount ?? 0;
    const completedCount = [walkCount, emotionCount, healthCount].filter((count) => count > 0).length;
    const hasCompletedToday = completedCount > 0;

    if (!dog) {
        return (
            <HomeInfoCard eyebrow="TODAY CARE" title="반려견을 먼저 등록해주세요" actionLabel="반려견 등록" onAction={onMoveToDogs}>
                <p className="text-sm leading-6 text-gray-500">
                    오늘 케어 현황은 등록된 반려견 기준으로 표시됩니다.
                </p>
            </HomeInfoCard>
        );
    }

    if (!dog.isVerified) {
        return (
            <HomeInfoCard eyebrow="TODAY CARE" title="인증 반려견부터 케어 가능" actionLabel="인증하러 가기" onAction={onMoveToDogs}>
                <p className="text-sm leading-6 text-gray-500">
                    산책과 케어 기록은 인증된 반려견을 기준으로 관리합니다.
                </p>
            </HomeInfoCard>
        );
    }

    return (
        <HomeInfoCard
            eyebrow="TODAY CARE"
            title={hasCompletedToday ? `오늘 ${completedCount}/3 기록 완료` : "오늘 기록 안함"}
            actionLabel="오늘 기록하기"
            onAction={onMoveToCare}
        >
            {isLoading ? (
                <p className="text-sm text-gray-400">오늘 케어 상태를 확인하는 중...</p>
            ) : (
                <div className="grid gap-3 text-sm text-gray-500">
                    <CareStatusRow label="산책" completed={walkCount > 0} />
                    <CareStatusRow label="감정" completed={emotionCount > 0} />
                    <CareStatusRow label="건강" completed={healthCount > 0} />
                </div>
            )}
        </HomeInfoCard>
    );
}

function DogSummaryCard({ dogs, primaryDog, verifiedDogCount, onMoveToDogs }) {
    return (
        <HomeInfoCard
            eyebrow="MY DOG"
            title={primaryDog ? `${primaryDog.name} 중심으로 관리 중` : "내 반려견 요약"}
            actionLabel="반려견 관리"
            onAction={onMoveToDogs}
        >
            <div className="grid grid-cols-2 gap-3">
                <MiniMetric label="등록" value={`${dogs.length}마리`} />
                <MiniMetric label="인증" value={`${verifiedDogCount}마리`} />
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-500">
                {primaryDog
                    ? `${primaryDog.breed || "견종 미입력"} · ${formatDogSize(primaryDog.size)} · ${primaryDog.isVerified ? "인증 완료" : "미인증"}`
                    : "아직 등록된 반려견이 없습니다."}
            </p>
        </HomeInfoCard>
    );
}

function NotificationSummaryCard({ unreadCount, onMoveToNotifications }) {
    return (
        <HomeInfoCard
            eyebrow="NOTICE"
            title={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "새 알림 없음"}
            actionLabel="마이페이지"
            onAction={onMoveToNotifications}
        >
            <p className="text-sm leading-6 text-gray-500">
                산책 신청, 승인, 채팅 알림을 놓치지 않도록 헤더에서도 바로 확인할 수 있어요.
            </p>
        </HomeInfoCard>
    );
}

function HomeInfoCard({ eyebrow, title, actionLabel, onAction, children }) {
    return (
        <article className="flex min-h-64 flex-col justify-between border border-gray-200 p-6">
            <div>
                <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">{eyebrow}</p>
                <h2 className="mt-4 text-2xl font-bold leading-8 text-gray-950">{title}</h2>
                <div className="mt-5">{children}</div>
            </div>

            <button
                type="button"
                onClick={onAction}
                className="mt-8 h-11 self-start border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
            >
                {actionLabel}
            </button>
        </article>
    );
}

function CareStatusRow({ label, completed }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
            <span>{label}</span>
            <span className={completed ? "font-bold text-emerald-600" : "text-gray-400"}>
                {completed ? "완료" : "미기록"}
            </span>
        </div>
    );
}

function MiniMetric({ label, value }) {
    return (
        <div className="border border-gray-100 p-3">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-2 text-xl font-bold text-gray-950">{value}</p>
        </div>
    );
}

function CommunityPopularSlide({ posts, isLoading, onMoveToCommunity, onSelect }) {
    return (
        <div className="flex h-full flex-col p-8">
            <div className="flex items-end justify-between gap-6">
                <div>
                    <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">COMMUNITY</p>
                    <h2 className="mt-3 text-3xl font-bold text-gray-950">커뮤니티 인기글</h2>
                    <p className="mt-3 text-sm text-gray-500">좋아요를 많이 받은 이야기를 먼저 확인해보세요.</p>
                </div>

                <button
                    type="button"
                    onClick={onMoveToCommunity}
                    className="h-11 shrink-0 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                >
                    커뮤니티 보기
                </button>
            </div>

            <div className="mt-8 grid flex-1 gap-4 md:grid-cols-2">
                {isLoading ? (
                    <div className="flex items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400 md:col-span-2">
                        인기글을 불러오는 중...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400 md:col-span-2">
                        아직 커뮤니티 인기글이 없습니다.
                    </div>
                ) : (
                    posts.slice(0, 4).map((post) => (
                        <button
                            key={post.communityPostId}
                            type="button"
                            onClick={() => onSelect(post)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                                    {getCommunityCategoryLabel(post.category)}
                                </span>
                                <span className="text-xs text-gray-400">{formatDateOnly(post.createdAt)}</span>
                            </div>
                            <h3 className="mt-4 line-clamp-1 text-xl font-bold text-gray-950">{post.title}</h3>
                            <p className="mt-4 text-sm text-gray-500">
                                좋아요 {post.likeCount ?? 0} · 댓글 {post.commentCount ?? 0} · 조회 {post.viewCount ?? 0}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

function PopularCommunitySection({ posts, isLoading, onMoveToCommunity, onSelect }) {
    return (
        <section className="mx-auto max-w-7xl px-8 pb-16">
            <div className="flex items-end justify-between gap-6 border-t border-gray-200 pt-12">
                <div>
                    <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">COMMUNITY</p>
                    <h2 className="mt-3 text-3xl font-bold text-gray-950">커뮤니티 인기글</h2>
                    <p className="mt-3 text-sm text-gray-500">좋아요를 많이 받은 이야기를 먼저 확인해보세요.</p>
                </div>

                <button
                    type="button"
                    onClick={onMoveToCommunity}
                    className="h-11 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                >
                    커뮤니티 보기
                </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400 md:col-span-2">
                        인기글을 불러오는 중...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex h-40 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400 md:col-span-2">
                        아직 커뮤니티 인기글이 없습니다.
                    </div>
                ) : (
                    posts.slice(0, 4).map((post) => (
                        <button
                            key={post.communityPostId}
                            type="button"
                            onClick={() => onSelect(post)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                                    {getCommunityCategoryLabel(post.category)}
                                </span>
                                <span className="text-xs text-gray-400">{formatDateOnly(post.createdAt)}</span>
                            </div>
                            <h3 className="mt-4 line-clamp-1 text-xl font-bold text-gray-950">{post.title}</h3>
                            <p className="mt-4 text-sm text-gray-500">
                                좋아요 {post.likeCount ?? 0} · 댓글 {post.commentCount ?? 0} · 조회 {post.viewCount ?? 0}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </section>
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

function formatLocalDate(date = new Date()) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

function getCommunityCategoryLabel(category) {
    if (category === "NOTICE") return "공지";
    if (category === "WALK_REVIEW") return "산책 후기";
    if (category === "DAILY") return "일상";
    if (category === "INFO") return "정보";
    if (category === "QUESTION") return "질문";
    return category || "게시글";
}
