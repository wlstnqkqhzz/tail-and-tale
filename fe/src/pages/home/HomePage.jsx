import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import AuthModal from "../../components/auth/AuthModal";
import { useAuth } from "../../hooks/useAuth";
import { getAccessToken } from "../../utils/token";
import { getWalkSchedules } from "../../api/walk";
import { getDogs } from "../../api/dog";
import { getCareSummary } from "../../api/care";
import { getCommunityPosts } from "../../api/community";
import { getNotifications } from "../../api/notification";

// 메인 랜딩 페이지

import { shortcutMenus } from "../../constants/homePage";
import { HomeFeatureShowcase } from "../../components/home/HomeSections";
import { formatLocalDate, getParticipantScore, isRegionMatched, normalizeRegion } from "../../utils/homePage";

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
            const timerId = window.setTimeout(() => {
                setActiveSlide(0);
            }, 0);

            return () => {
                window.clearTimeout(timerId);
            };
        }
    }, [activeSlide]);

    // 로그인 후 홈 화면 데이터 조회
    useEffect(() => {
        if (!isLoggedIn) {
            const timerId = window.setTimeout(() => {
                setWalkSchedules([]);
                setDogs([]);
                setCareSummary(null);
                setPopularPosts([]);
                setUnreadNotificationCount(0);
            }, 0);

            return () => {
                window.clearTimeout(timerId);
            };
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
            const timerId = window.setTimeout(() => {
                setCareSummary(null);
            }, 0);

            return () => {
                window.clearTimeout(timerId);
            };
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
                <h1 className="mb-6 text-6xl font-bold leading-[1.2] text-gray-900">
                    반려견과의 이야기를
                    <br/>
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
