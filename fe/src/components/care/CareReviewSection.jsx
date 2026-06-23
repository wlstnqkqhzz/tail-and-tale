// 케어 결산 영역

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { getConditionIcon, getConditionLabel } from "../../constants/conditionIcons";
import { emotionLabels, healthLabels, riskLabels } from "../../constants/carePage";
import {
    buildDateRange,
    getMondayBasedWeekday,
    getMonthWeekOptions,
    getReviewStats,
    getSelectedMonthWeekNumber,
    groupFirstByDate,
    groupManyByDate,
} from "../../utils/careDate";

export function ReviewSection({
    mode,
    range,
    anchorDate,
    emotionDiaries,
    healthRecords,
    walkRecords,
    analyses,
    isSubmitting,
    onModeChange,
    onAnchorDateChange,
    onCreateReview,
}) {
    const days = useMemo(
        () => buildDateRange(range.startDate, range.endDate),
        [range.startDate, range.endDate]
    );
    const diariesByDate = useMemo(
        () => groupFirstByDate(emotionDiaries, "recordedDate"),
        [emotionDiaries]
    );
    const healthByDate = useMemo(
        () => groupFirstByDate(healthRecords, "recordedDate"),
        [healthRecords]
    );
    const walksByDate = useMemo(
        () => groupManyByDate(walkRecords, "startedAt"),
        [walkRecords]
    );
    const periodAnalyses = useMemo(
        () => analyses.filter((analysis) => (
            analysis.analysisType === "CARE_GUIDE"
            && analysis.targetStartDate === range.startDate
            && analysis.targetEndDate === range.endDate
        )),
        [analyses, range.endDate, range.startDate]
    );
    const monthValue = anchorDate.slice(0, 7);
    const weekOptions = useMemo(
        () => getMonthWeekOptions(monthValue),
        [monthValue]
    );
    const selectedWeekNumber = getSelectedMonthWeekNumber(anchorDate, weekOptions);
    const stats = getReviewStats(days, diariesByDate, walksByDate);
    const leadingBlankCount = getMondayBasedWeekday(range.startDate);
    const loadingTitle = mode === "week"
        ? "AI가 이번 주 기록을 분석하고 있어요..."
        : "AI가 이번 달 기록을 분석하고 있어요...";

    const handleMonthChange = (event) => {
        const nextMonthValue = event.target.value;
        const nextAnchorDate = mode === "week"
            ? getMonthWeekOptions(nextMonthValue)[0]?.startDate || `${nextMonthValue}-01`
            : `${nextMonthValue}-01`;

        onAnchorDateChange(nextAnchorDate);
    };

    return (
        <div className="grid gap-8 py-8">
            <section className="border border-gray-200 p-6">
                <FormTitle label="CARE REVIEW" title="케어 결산" />
                <p className="max-w-3xl text-sm leading-6 text-gray-500">
                    감정 일기 컨디션을 기준으로 하루 상태를 표시하고, 선택한 기간의 AI 리뷰를 요청할 수 있습니다.
                </p>

                <div className="mt-6 grid gap-4 border-y border-gray-100 py-5 xl:grid-cols-[180px_220px_1fr_180px] xl:items-end">
                    <div>
                        <p className="mb-2 text-xs font-bold text-gray-400">결산 단위</p>
                        <div className="grid grid-cols-2 border border-gray-200">
                            {[
                                { value: "week", label: "주간" },
                                { value: "month", label: "월간" },
                            ].map((option) => {
                                const active = mode === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onModeChange(option.value)}
                                        className={`h-11 text-sm font-bold transition ${
                                            active ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="grid gap-2 text-xs font-bold text-gray-400">
                        월 선택
                        <input
                            type="month"
                            value={monthValue}
                            onChange={handleMonthChange}
                            className="input h-11"
                        />
                    </label>

                    <div>
                        <p className="mb-2 text-xs font-bold text-gray-400">
                            {mode === "week" ? "주차 선택" : "월간 범위"}
                        </p>
                        {mode === "week" ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                {weekOptions.map((option) => {
                                    const active = selectedWeekNumber === option.weekNumber;

                                    return (
                                        <button
                                            key={option.weekNumber}
                                            type="button"
                                            onClick={() => onAnchorDateChange(option.startDate)}
                                            className={`h-11 border text-sm font-bold transition ${
                                                active
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 text-gray-500 hover:border-gray-400"
                                            }`}
                                        >
                                            {option.weekNumber}주차
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex h-11 items-center border border-gray-200 px-4 text-sm font-bold text-gray-700">
                                {range.startDate} ~ {range.endDate}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onCreateReview}
                        disabled={isSubmitting}
                        className="h-11 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isSubmitting ? "요청 중..." : mode === "week" ? "주간 리뷰 요청" : "월간 리뷰 요청"}
                    </button>
                </div>

                <div className="grid gap-3 border-b border-gray-100 py-5 md:grid-cols-3">
                    <ReviewStat label="기간" value={`${range.startDate} ~ ${range.endDate}`} />
                    <ReviewStat label="감정 기록" value={`${stats.recordedDays}일`} />
                    <ReviewStat label="산책 기록" value={`${stats.walkCount}회`} />
                </div>

                <div className="mt-6 grid grid-cols-7 border-l border-t border-gray-200">
                    {["월", "화", "수", "목", "금", "토", "일"].map((weekday) => (
                        <div key={weekday} className="border-b border-r border-gray-200 py-2 text-center text-xs font-bold text-gray-400">
                            {weekday}
                        </div>
                    ))}
                    {Array.from({ length: leadingBlankCount }).map((_, index) => (
                        <div key={`blank-${index}`} className="min-h-28 border-b border-r border-gray-200 bg-gray-50" />
                    ))}
                    {days.map((date) => {
                        const diary = diariesByDate.get(date);
                        const health = healthByDate.get(date);
                        const walks = walksByDate.get(date) || [];

                        return (
                            <ReviewDayCell
                                key={date}
                                date={date}
                                diary={diary}
                                health={health}
                                walkCount={walks.length}
                            />
                        );
                    })}
                </div>
            </section>

            <section className="grid gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-950">요청한 결산 리뷰</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            현재 선택한 기간과 일치하는 AI 리뷰만 표시합니다.
                        </p>
                    </div>
                    <span className="text-sm font-bold text-gray-400">{periodAnalyses.length}건</span>
                </div>

                {isSubmitting ? (
                    <ReviewLoadingState title={loadingTitle} />
                ) : (
                    <RecordList emptyText="아직 이 기간의 결산 리뷰가 없습니다.">
                        {periodAnalyses.map((analysis) => (
                            <div key={analysis.aiAnalysisResultId} className="border border-gray-200 p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                        {analysis.targetStartDate} ~ {analysis.targetEndDate}
                                    </span>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                        위험도 {riskLabels[analysis.riskLevel]}
                                    </span>
                                </div>
                                <h4 className="mt-4 text-lg font-bold text-gray-950">{analysis.summary}</h4>
                                <div className="prose prose-sm max-w-none mt-4">
                                    <ReactMarkdown>
                                        {analysis.resultContent}
                                    </ReactMarkdown>
                                </div>

                                {analysis.guideContent && (
                                    <div className="prose prose-sm max-w-none mt-4 border-t border-gray-100 pt-4">
                                        <ReactMarkdown>
                                            {analysis.guideContent}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}
                    </RecordList>
                )}
            </section>
        </div>
    );
}

function ReviewLoadingState({ title }) {
    return (
        <div className="flex h-64 flex-col items-center justify-center border border-dashed border-gray-200 bg-white text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-100 border-t-violet-500" />
            <p className="mt-5 text-lg font-bold text-gray-800">{title}</p>
            <p className="mt-2 text-sm font-bold text-gray-400">잠시만 기다려주세요.</p>
        </div>
    );
}

function FormTitle({ label, title }) {
    return (
        <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.3em] text-gray-400">{label}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-950">{title}</h2>
        </div>
    );
}

function RecordList({ emptyText, children }) {
    const hasRecords = Array.isArray(children) ? children.length > 0 : Boolean(children);

    if (!hasRecords) {
        return (
            <div className="flex h-64 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                {emptyText}
            </div>
        );
    }

    return <div className="grid gap-3">{children}</div>;
}

function ReviewStat({ label, value }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-2 text-lg font-bold text-gray-950">{value}</p>
        </div>
    );
}

function ReviewDayCell({ date, diary, health, walkCount }) {
    const conditionLevel = diary?.conditionLevel ? Number(diary.conditionLevel) : null;
    const conditionIcon = diary ? getConditionIcon(conditionLevel) : null;
    const conditionLabel = conditionLevel ? getConditionLabel(conditionLevel) : emotionLabels[diary?.emotion];
    const day = Number(date.slice(8, 10));

    return (
        <div className="min-h-28 border-b border-r border-gray-200 p-3">
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-gray-950">{day}</span>
                {conditionIcon ? (
                    <img src={conditionIcon} alt={conditionLabel} className="h-9 w-9 object-contain" />
                ) : (
                    <span className="text-2xl leading-none text-gray-950">·</span>
                )}
            </div>
            <div className="mt-3 grid gap-1 text-xs text-gray-400">
                {diary ? (
                    <>
                        <span className="truncate">{diary.behaviorPattern || diary.diaryContent || "감정 기록 있음"}</span>
                    </>
                ) : (
                    <span>감정 기록 없음</span>
                )}
                {walkCount > 0 && <span className="text-emerald-600">산책 {walkCount}회</span>}
                {health?.healthStatus && <span>건강 {healthLabels[health.healthStatus]}</span>}
            </div>
        </div>
    );
}

// 오늘 기록 모달
