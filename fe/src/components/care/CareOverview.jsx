// 케어 요약 영역

import { emotionLabels, healthLabels, tabs } from "../../constants/carePage";
import { toNumber } from "../../utils/careDate";

export function CareSummary({ summary, selectedDog }) {
    const walkSummary = summary?.walkSummary;
    const emotionSummary = summary?.emotionSummary;
    const healthSummary = summary?.healthSummary;
    const items = [
        { label: "선택 반려견", value: selectedDog?.name || "-" },
        { label: "산책 기록", value: walkSummary?.totalCount ?? 0 },
        { label: "총 산책 거리", value: walkSummary?.totalDistanceKm ? `${walkSummary.totalDistanceKm}km` : "-" },
        { label: "감정 기록", value: emotionSummary?.totalCount ?? 0 },
        { label: "최근 몸무게", value: healthSummary?.latestWeight ? `${healthSummary.latestWeight}kg` : "-" },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {items.map((item) => (
                <div key={item.label} className="flex h-32 flex-col justify-between border border-gray-200 p-5">
                    <p className="text-sm font-bold text-gray-400">{item.label}</p>
                    <p className="truncate text-3xl font-bold text-gray-950">{item.value}</p>
                </div>
            ))}
        </div>
    );
}

// 오늘 기록 빠른 시작
// 케어 기록 그래프
export function CareTrendPanel({ trend }) {
    const walkTrend = trend?.walkTrend || [];
    const emotionTrend = trend?.emotionTrend || [];
    const healthTrend = trend?.healthTrend || [];
    const hasTrend = walkTrend.length > 0 || emotionTrend.length > 0 || healthTrend.length > 0;
    const totalWalkMinutes = walkTrend.reduce((total, item) => total + toNumber(item.totalDurationMinutes), 0);
    const latestEmotion = [...emotionTrend].reverse().find((item) => item.conditionLevel || item.emotion);
    const latestHealth = [...healthTrend].reverse().find((item) => item.weight || item.healthStatus);

    if (!hasTrend) {
        return null;
    }

    return (
        <section className="mt-6 border border-gray-200 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-bold tracking-[0.3em] text-emerald-600">CARE GRAPH</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">최근 케어 기록 흐름</h2>
                </div>
                <p className="text-sm font-bold text-gray-400">
                    {trend?.startDate} ~ {trend?.endDate}
                </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <TrendCard
                    label="WALK"
                    title="산책 시간"
                    value={`${totalWalkMinutes}분`}
                    description="일자별 총 산책 시간"
                >
                    <BarTrendChart data={walkTrend} valueKey="totalDurationMinutes" barClassName="fill-emerald-500" />
                </TrendCard>

                <TrendCard
                    label="EMOTION"
                    title="컨디션 점수"
                    value={latestEmotion?.conditionLevel ? `${latestEmotion.conditionLevel}점` : "-"}
                    description={latestEmotion?.emotion ? emotionLabels[latestEmotion.emotion] : "최근 감정 기록 없음"}
                >
                    <LineTrendChart data={emotionTrend} valueKey="conditionLevel" maxValue={5} lineColor="#111827" dotColor="#10b981" />
                </TrendCard>

                <TrendCard
                    label="HEALTH"
                    title="몸무게 변화"
                    value={latestHealth?.weight ? `${latestHealth.weight}kg` : "-"}
                    description={latestHealth?.healthStatus ? healthLabels[latestHealth.healthStatus] : "최근 건강 기록 없음"}
                >
                    <LineTrendChart data={healthTrend} valueKey="weight" lineColor="#111827" dotColor="#6366f1" />
                </TrendCard>
            </div>
        </section>
    );
}

function TrendCard({ label, title, value, description, children }) {
    return (
        <div className="grid gap-4 border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.25em] text-gray-400">{label}</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-950">{title}</h3>
                    <p className="mt-1 truncate text-xs font-bold text-gray-400">{description}</p>
                </div>
                <strong className="shrink-0 text-2xl font-bold text-gray-950">{value}</strong>
            </div>
            {children}
        </div>
    );
}

function BarTrendChart({ data, valueKey, barClassName }) {
    const values = data.map((item) => toNumber(item[valueKey]));
    const maxValue = Math.max(...values, 1);
    const barWidth = 100 / Math.max(data.length, 1);

    return (
        <div className="h-36 w-full">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                {data.map((item, index) => {
                    const value = toNumber(item[valueKey]);
                    const height = value === 0 ? 1 : Math.max((value / maxValue) * 54, 3);
                    const x = index * barWidth + 0.6;
                    const y = 58 - height;

                    return (
                        <rect
                            key={item.date}
                            x={x}
                            y={y}
                            width={Math.max(barWidth - 1.2, 1)}
                            height={height}
                            rx="0.8"
                            className={value === 0 ? "fill-gray-100" : barClassName}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

function LineTrendChart({ data, valueKey, maxValue, lineColor, dotColor }) {
    const points = data
        .map((item, index) => ({ item, index, value: toNumber(item[valueKey]) }))
        .filter((point) => point.value > 0);
    const chartMaxValue = maxValue || Math.max(...points.map((point) => point.value), 1);
    const step = data.length > 1 ? 100 / (data.length - 1) : 100;
    const polylinePoints = points
        .map((point) => `${point.index * step},${58 - (point.value / chartMaxValue) * 52}`)
        .join(" ");

    return (
        <div className="h-36 w-full">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <line x1="0" y1="58" x2="100" y2="58" stroke="#e5e7eb" strokeWidth="0.8" />
                {polylinePoints && (
                    <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {points.map((point) => {
                    const x = point.index * step;
                    const y = 58 - (point.value / chartMaxValue) * 52;

                    return (
                        <circle
                            key={point.item.date}
                            cx={x}
                            cy={y}
                            r="1.8"
                            fill={dotColor}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

export function QuickRecordBanner({ selectedDog, onStart }) {
    return (
        <section className="mt-6 border border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-bold tracking-[0.25em] text-emerald-600">TODAY CARE</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">
                        오늘 {selectedDog?.name || "반려견"} 기록하기
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        산책, 감정, 건강 체크를 한 번에 남겨두면 매일 기록하기가 훨씬 가벼워집니다.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onStart}
                    className="h-12 shrink-0 rounded-full bg-black px-8 text-sm font-bold text-white transition hover:opacity-80"
                >
                    오늘 기록하기
                </button>
            </div>
        </section>
    );
}

// 케어 탭
export function CareTabs({ activeTab, onChange }) {
    return (
        <nav className="mt-8 grid border-b border-gray-200 sm:grid-cols-5">
            {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChange(tab.key)}
                        className={`h-14 border-b-2 text-sm font-bold transition ${
                            active
                                ? "border-black text-black"
                                : "border-transparent text-gray-400 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}

// 케어 결산 영역
