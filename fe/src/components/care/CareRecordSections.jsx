// 케어 기록 탭 영역

import { getConditionIcon, getConditionLabel } from "../../constants/conditionIcons";
import {
    analysisLabels,
    conditionAfterWalkLabels,
    emotionLabels,
    healthLabels,
    quickEmotionOptions,
    riskLabels,
} from "../../constants/carePage";
import { formatDateOnly } from "../../utils/careDate";

export function WalkSection({ form, records, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
    return (
        <div className={`grid gap-8 py-8 ${isEditing ? "lg:grid-cols-[420px_1fr]" : ""}`}>
            {isEditing && (
                <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
                    <FormTitle label="WALK" title="산책 기록 수정" />
                    <div className="grid gap-4">
                        <InputField label="시작 시간">
                            <input type="datetime-local" name="startedAt" value={form.startedAt} onChange={onChange} className="input" />
                        </InputField>
                        <InputField label="종료 시간">
                            <input type="datetime-local" name="endedAt" value={form.endedAt} onChange={onChange} className="input" />
                        </InputField>
                        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                            <InputField label="산책 시간">
                                <input type="number" name="durationMinutes" min="1" value={form.durationMinutes} onChange={onChange} className="input" placeholder="분" />
                            </InputField>
                            <InputField label="산책 거리">
                                <input type="number" step="0.01" name="distanceKm" min="0" value={form.distanceKm} onChange={onChange} className="input" placeholder="km" />
                            </InputField>
                        </div>
                        <InputField label="산책 후 상태">
                            <select name="conditionAfterWalk" value={form.conditionAfterWalk} onChange={onChange} className="input">
                                {Object.entries(conditionAfterWalkLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </InputField>
                        <InputField label="경로 요약">
                            <input name="routeSummary" value={form.routeSummary} onChange={onChange} className="input" placeholder="예: 남강공원 한 바퀴" />
                        </InputField>
                        <InputField label="메모">
                            <textarea name="memo" value={form.memo} onChange={onChange} className="textarea" placeholder="산책 중 특이사항을 기록해주세요" />
                        </InputField>
                    </div>
                    <FormActions isSubmitting={isSubmitting} isEditing={isEditing} onReset={onReset} />
                </form>
            )}

            <RecordList emptyText="아직 산책 기록이 없습니다.">
                {records.map((record) => (
                    <RecordCard
                        key={record.walkRecordId}
                        title={`${conditionAfterWalkLabels[record.conditionAfterWalk] || "상태 미입력"} · ${record.durationMinutes ? `${record.durationMinutes}분` : "시간 미입력"}`}
                        meta={`${formatDateOnly(record.startedAt)} · ${record.dogName}`}
                        content={record.memo || record.routeSummary || "기록된 내용이 없습니다."}
                        onEdit={() => onEdit(record)}
                        onDelete={() => onDelete(record.walkRecordId)}
                    />
                ))}
            </RecordList>
        </div>
    );
}

// 감정 일기 영역
export function EmotionSection({ form, walkRecords, diaries, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
    return (
        <div className={`grid gap-8 py-8 ${isEditing ? "lg:grid-cols-[420px_1fr]" : ""}`}>
            {isEditing && (
                <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
                    <FormTitle label="EMOTION" title="감정 일기 수정" />
                    <div className="grid gap-4">
                        <InputField label="기록일">
                            <input type="date" name="recordedDate" value={form.recordedDate} onChange={onChange} className="input" />
                        </InputField>
                        <InputField label="연결 산책 기록">
                            <select name="walkRecordId" value={form.walkRecordId} onChange={onChange} className="input">
                                <option value="">연결 안 함</option>
                                {walkRecords.map((record) => (
                                    <option key={record.walkRecordId} value={record.walkRecordId}>
                                        {formatDateOnly(record.startedAt)} · {record.routeSummary || `${record.durationMinutes || "-"}분 산책`}
                                    </option>
                                ))}
                            </select>
                        </InputField>
                        <InputField label="감정">
                            <div className="grid grid-cols-5 gap-2">
                                {quickEmotionOptions.map((option) => {
                                    const active = form.emotion === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => onChange({ target: { name: "emotion", value: option.value } })}
                                            className={`grid h-20 place-items-center border text-center transition ${
                                                active
                                                    ? "border-black bg-gray-50 text-gray-950"
                                                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                                            }`}
                                        >
                                            <img
                                                src={getConditionIcon(option.conditionLevel)}
                                                alt={getConditionLabel(option.conditionLevel)}
                                                className="h-9 w-9 object-contain"
                                            />
                                            <span className="text-[11px] font-bold">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </InputField>
                        <InputField label="행동 패턴">
                            <input name="behaviorPattern" value={form.behaviorPattern} onChange={onChange} className="input" placeholder="예: 산책 후 잘 쉬었어요" />
                        </InputField>
                        <InputField label="일기 내용">
                            <textarea name="diaryContent" value={form.diaryContent} onChange={onChange} className="textarea" placeholder="오늘의 감정과 행동 변화를 기록해주세요" />
                        </InputField>
                    </div>
                    <FormActions isSubmitting={isSubmitting} isEditing={isEditing} onReset={onReset} />
                </form>
            )}

            <RecordList emptyText="아직 감정 일기가 없습니다.">
                {diaries.map((diary) => (
                    <RecordCard
                        key={diary.emotionDiaryId}
                        title={emotionLabels[diary.emotion]}
                        meta={`${diary.recordedDate} · ${diary.dogName}`}
                        content={diary.diaryContent || diary.behaviorPattern || "기록된 내용이 없습니다."}
                        icon={getConditionIcon(diary.conditionLevel)}
                        iconAlt={getConditionLabel(diary.conditionLevel)}
                        onEdit={() => onEdit(diary)}
                        onDelete={() => onDelete(diary.emotionDiaryId)}
                    />
                ))}
            </RecordList>
        </div>
    );
}

// 건강 기록 영역
export function HealthSection({ form, records, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
    return (
        <div className={`grid gap-8 py-8 ${isEditing ? "lg:grid-cols-[420px_1fr]" : ""}`}>
            {isEditing && (
                <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
                    <FormTitle label="HEALTH" title="건강 기록 수정" />
                    <div className="grid gap-4">
                        <InputField label="기록일">
                            <input type="date" name="recordedDate" value={form.recordedDate} onChange={onChange} className="input" />
                        </InputField>
                        <InputField label="몸무게">
                            <input type="number" step="0.01" name="weight" value={form.weight} onChange={onChange} className="input" placeholder="kg" />
                        </InputField>
                        <InputField label="건강 상태">
                            <select name="healthStatus" value={form.healthStatus} onChange={onChange} className="input">
                                {Object.entries(healthLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </InputField>
                        <InputField label="증상">
                            <input name="symptoms" value={form.symptoms} onChange={onChange} className="input" placeholder="예: 기침, 식욕 저하" />
                        </InputField>
                        <InputField label="메모">
                            <textarea name="memo" value={form.memo} onChange={onChange} className="textarea" placeholder="오늘의 건강 상태를 기록해주세요" />
                        </InputField>
                    </div>
                    <FormActions isSubmitting={isSubmitting} isEditing={isEditing} onReset={onReset} />
                </form>
            )}

            <RecordList emptyText="아직 건강 기록이 없습니다.">
                {records.map((record) => (
                    <RecordCard
                        key={record.healthRecordId}
                        title={`${healthLabels[record.healthStatus] || "상태 미입력"} · ${record.weight ? `${record.weight}kg` : "몸무게 미입력"}`}
                        meta={`${record.recordedDate} · ${record.dogName}`}
                        content={record.memo || record.symptoms || "기록된 내용이 없습니다."}
                        onEdit={() => onEdit(record)}
                        onDelete={() => onDelete(record.healthRecordId)}
                    />
                ))}
            </RecordList>
        </div>
    );
}

// AI 분석 영역
export function AnalysisSection({ analysisType, analyses, isSubmitting, onTypeChange, onCreate }) {
    return (
        <div className="grid gap-8 py-8 lg:grid-cols-[420px_1fr]">
            <div className="h-fit border border-gray-200 p-6">
                <FormTitle label="AI CARE" title="AI 분석 생성" />
                <InputField label="분석 유형">
                    <select value={analysisType} onChange={(event) => onTypeChange(event.target.value)} className="input">
                        {Object.entries(analysisLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </InputField>
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={isSubmitting}
                    className="mt-6 h-12 w-full bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {isSubmitting ? "분석 중..." : "분석 생성"}
                </button>
                <p className="mt-4 text-xs leading-5 text-gray-400">
                    현재는 기록 데이터를 기반으로 요약과 위험도, 관리 가이드를 생성하는 1차 분석입니다.
                </p>
            </div>

            <RecordList emptyText="아직 AI 분석 결과가 없습니다.">
                {analyses.map((analysis) => (
                    <div key={analysis.aiAnalysisResultId} className="border border-gray-200 p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                {analysisLabels[analysis.analysisType]}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                위험도 {riskLabels[analysis.riskLevel]}
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-gray-950">{analysis.summary}</h3>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-500">{analysis.resultContent}</p>
                        {analysis.guideContent && (
                            <p className="mt-3 whitespace-pre-line border-t border-gray-100 pt-3 text-sm leading-6 text-gray-700">
                                {analysis.guideContent}
                            </p>
                        )}
                    </div>
                ))}
            </RecordList>
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

function InputField({ label, children }) {
    return (
        <label className="grid min-w-0 gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}

function FormActions({ isSubmitting, isEditing, onReset }) {
    return (
        <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={onReset} className="h-12 border border-gray-200 text-sm font-bold transition hover:bg-gray-50">
                취소
            </button>
            <button type="submit" disabled={isSubmitting} className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300">
                {isSubmitting ? "저장 중..." : isEditing ? "수정하기" : "저장하기"}
            </button>
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

function RecordCard({ title, meta, content, icon, iconAlt, onEdit, onDelete }) {
    return (
        <div className="grid gap-4 border border-gray-200 p-5 md:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 gap-4">
                {icon && <img src={icon} alt={iconAlt || ""} className="mt-1 h-11 w-11 shrink-0 object-contain" />}
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400">{meta}</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-950">{title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{content}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:w-36 md:self-start">
                <button type="button" onClick={onEdit} className="h-10 border border-gray-200 text-sm font-bold transition hover:bg-gray-50">
                    수정
                </button>
                <button type="button" onClick={onDelete} className="h-10 border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50">
                    삭제
                </button>
            </div>
        </div>
    );
}
