// 산책 게시글 목록 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import RegionSelect from "../../components/common/RegionSelect";
import { InfoBadge, StatusBadge } from "../../components/walk/WalkBadges";
import { getWalkSchedules } from "../../api/walk";
import { getAccessToken } from "../../utils/token";
import { formatAverageRating, formatDateTime, formatDogSize, formatParticipantStatus } from "../../utils/walkFormat";

const initialFilters = {
    keyword: "",
    region: "",
    status: "",
    preferredDogSize: "",
    scheduledFrom: "",
    scheduledTo: "",
    recruitableOnly: false,
};

// URL 검색 조건을 입력 폼 상태로 변환
const createFiltersFromSearchParams = (searchParams) => ({
    ...initialFilters,
    keyword: searchParams.get("keyword") || "",
    region: searchParams.get("region") || "",
    status: searchParams.get("status") || "",
    preferredDogSize: searchParams.get("preferredDogSize") || "",
    scheduledFrom: searchParams.get("scheduledFrom") || "",
    scheduledTo: searchParams.get("scheduledTo") || "",
    recruitableOnly: searchParams.get("recruitableOnly") === "true",
});

// API 검색 파라미터 생성
const createScheduleSearchParams = (filters) => {
    const params = {};

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
            params[key] = value;
        }
    });

    return params;
};

export default function WalksPage() {
    const navigate = useNavigate();
    const [urlSearchParams, setUrlSearchParams] = useSearchParams();

    // 산책 목록 상태
    const [walkSchedules, setWalkSchedules] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // 검색 필터 상태
    const [filters, setFilters] = useState(() => createFiltersFromSearchParams(urlSearchParams));

    // 산책 게시글 목록 조회
    const fetchSchedules = useCallback(async (searchParams = {}, showInitialLoading = false) => {
        try {
            if (showInitialLoading) {
                setIsInitialLoading(true);
            } else {
                setIsSearching(true);
            }

            const response = await getWalkSchedules(searchParams);

            setWalkSchedules(response.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 게시글 목록 조회에 실패했습니다.");
        } finally {
            setIsInitialLoading(false);
            setIsSearching(false);
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
            fetchSchedules(createScheduleSearchParams(createFiltersFromSearchParams(urlSearchParams)), true);
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchSchedules, navigate]);

    // 필터 변경
    const handleFilterChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // 검색
    const handleSearch = (event) => {
        event.preventDefault();

        const nextSearchParams = createScheduleSearchParams(filters);

        setUrlSearchParams(nextSearchParams);
        fetchSchedules(nextSearchParams);
    };

    // 검색 초기화
    const resetFilters = () => {
        setFilters(initialFilters);
        setUrlSearchParams({});
        fetchSchedules({});
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-16">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                                WALK BOARD
                            </p>
                            <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                                오늘 같이 걸을
                                <br />
                                산책 메이트를 찾아보세요
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                지역, 반려견 크기, 시간대를 기준으로 산책 게시글을 탐색하고
                                마음에 드는
                                <br />
                                일정의 상세 페이지에서 참여를 신청할 수 있습니다.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/walks/new")}
                            className="h-12 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:opacity-80"
                        >
                            산책 글 작성
                        </button>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-8 py-10">
                    <form
                        onSubmit={handleSearch}
                        className="grid gap-3 border-y border-gray-200 py-5 lg:grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_auto_auto]"
                    >
                        <input
                            name="keyword"
                            value={filters.keyword}
                            onChange={handleFilterChange}
                            className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                            placeholder="제목, 설명, 장소 검색"
                        />

                        <RegionSelect
                            value={filters.region}
                            onChange={(region) => setFilters((prevFilters) => ({ ...prevFilters, region }))}
                            selectClassName="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
                        />

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        >
                            <option value="">상태 전체</option>
                            <option value="OPEN">모집 중</option>
                            <option value="CLOSED">모집 마감</option>
                        </select>

                        <select
                            name="preferredDogSize"
                            value={filters.preferredDogSize}
                            onChange={handleFilterChange}
                            className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        >
                            <option value="">크기 전체</option>
                            <option value="ANY">무관</option>
                            <option value="SMALL">소형</option>
                            <option value="MEDIUM">중형</option>
                            <option value="LARGE">대형</option>
                        </select>

                        <label className="flex h-12 items-center gap-2 border border-gray-200 px-4 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                name="recruitableOnly"
                                checked={filters.recruitableOnly}
                                onChange={handleFilterChange}
                                className="h-4 w-4 accent-black"
                            />
                            모집 가능
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-12 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                            >
                                초기화
                            </button>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="h-12 bg-black px-5 text-sm font-bold text-white transition hover:opacity-80"
                            >
                                {isSearching ? "검색 중" : "검색"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            총 <span className="font-bold text-gray-950">{walkSchedules.length}</span>개의 산책 게시글
                        </p>
                    </div>

                    {isInitialLoading ? (
                        <div className="flex h-80 items-center justify-center border-b border-gray-100 text-sm text-gray-400">
                            불러오는 중...
                        </div>
                    ) : walkSchedules.length === 0 ? (
                        <div className="mt-8 flex h-80 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                            조회된 산책 게시글이 없습니다.
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {walkSchedules.map((schedule) => (
                                <WalkScheduleCard
                                    key={schedule.walkScheduleId}
                                    schedule={schedule}
                                    onClick={() => navigate(`/walks/${schedule.walkScheduleId}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

// 산책 게시글 카드
function WalkScheduleCard({ schedule, onClick }) {
    const hasMyStatus = Boolean(schedule.myParticipantStatus);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex min-h-72 flex-col justify-between border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-gray-950 hover:shadow-xl ${
                hasMyStatus ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-200"
            }`}
        >
            <div>
                <div className="flex items-start justify-between gap-4">
                    <StatusBadge status={schedule.status} />
                    {schedule.isRecruitable && <InfoBadge label="모집 가능" tone="green" />}
                </div>

                <h2 className="mt-6 line-clamp-2 text-2xl font-bold leading-8 text-gray-950">
                    {schedule.title}
                </h2>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                    {schedule.description || "등록된 설명이 없습니다."}
                </p>
                {schedule.reviewCount > 0 && (
                    <p className="mt-4 text-sm font-bold text-amber-500">
                        {formatAverageRating(schedule.averageRating)}
                    </p>
                )}
            </div>

            <div className="mt-8">
                <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 text-sm">
                    <SummaryItem label="지역" value={schedule.region} />
                    <SummaryItem label="일시" value={formatDateTime(schedule.scheduledAt)} />
                    <SummaryItem label="장소" value={schedule.meetingPlace} />
                    <SummaryItem
                        label="참여"
                        value={`${schedule.currentParticipantCount}/${schedule.maxParticipants}명`}
                    />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <InfoBadge label={formatDogSize(schedule.preferredDogSize)} />
                    {schedule.pendingRequestCount > 0 && (
                        <InfoBadge label={`대기 ${schedule.pendingRequestCount}건`} tone="amber" />
                    )}
                    {schedule.myParticipantStatus && (
                        <InfoBadge
                            label={`내 신청 ${formatParticipantStatus(schedule.myParticipantStatus)}`}
                            tone="blue"
                        />
                    )}
                </div>
            </div>
        </button>
    );
}

// 카드 요약 정보
function SummaryItem({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-800">{value || "미입력"}</p>
        </div>
    );
}
