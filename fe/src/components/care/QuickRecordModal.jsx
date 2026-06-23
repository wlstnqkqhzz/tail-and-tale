// 오늘 기록 모달

import { getConditionIcon, getConditionLabel } from "../../constants/conditionIcons";
import { conditionAfterWalkLabels, healthLabels, quickEmotionOptions, quickSteps } from "../../constants/carePage";

export function QuickRecordModal({
    form,
    step,
    isClosing,
    isSubmitting,
    selectedDog,
    onChange,
    onEmotionSelect,
    onPrev,
    onNext,
    onClose,
    onSubmit,
}) {
    const isFirstStep = step === 0;
    const isLastStep = step === quickSteps.length - 1;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 ${
                isClosing
                    ? "pointer-events-none animate-[overlayFadeOut_0.16s_ease-in_forwards]"
                    : "animate-[overlayFadeIn_0.16s_ease-out]"
            }`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-2xl border border-gray-200 bg-white p-6 shadow-2xl ${
                    isClosing
                        ? "animate-[modalFadeOut_0.16s_ease-in_forwards]"
                        : "animate-[modalFadeIn_0.18s_ease-out]"
                }`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold tracking-[0.3em] text-emerald-600">TODAY</p>
                        <h2 className="mt-3 text-2xl font-bold text-gray-950">
                            오늘 {selectedDog?.name || "반려견"} 기록
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 w-10 border border-gray-200 text-lg font-bold text-gray-500 transition hover:bg-gray-50"
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                <QuickStepIndicator step={step} />

                <div className="mt-8 min-h-[320px]">
                    {step === 0 && (
                        <div className="grid gap-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-950">오늘 산책 했나요?</h3>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {[
                                        { value: "yes", label: "예" },
                                        { value: "no", label: "아니오" },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex h-12 cursor-pointer items-center justify-center border text-sm font-bold transition ${
                                                form.hasWalk === option.value
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="hasWalk"
                                                value={option.value}
                                                checked={form.hasWalk === option.value}
                                                onChange={onChange}
                                                className="sr-only"
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {form.hasWalk === "yes" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <QuickField label="산책 시간">
                                        <input
                                            type="number"
                                            name="durationMinutes"
                                            min="1"
                                            value={form.durationMinutes}
                                            onChange={onChange}
                                            className="input"
                                            placeholder="45분"
                                        />
                                    </QuickField>
                                    <QuickField label="산책 거리">
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="distanceKm"
                                            min="0"
                                            value={form.distanceKm}
                                            onChange={onChange}
                                            className="input"
                                            placeholder="2.3km"
                                        />
                                    </QuickField>
                                    <QuickField label="산책 후 상태">
                                        <select
                                            name="conditionAfterWalk"
                                            value={form.conditionAfterWalk}
                                            onChange={onChange}
                                            className="input"
                                        >
                                            {Object.entries(conditionAfterWalkLabels).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </QuickField>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="grid gap-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-950">오늘 기분은?</h3>
                                <div className="mt-5 grid grid-cols-5 gap-3">
                                    {quickEmotionOptions.map((option) => {
                                        const active = form.emotion === option.value;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => onEmotionSelect(option)}
                                                className={`grid h-24 place-items-center border text-center transition ${
                                                    active
                                                        ? "border-black bg-gray-50 text-gray-950"
                                                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                                                }`}
                                            >
                                                <img
                                                    src={getConditionIcon(option.conditionLevel)}
                                                    alt={getConditionLabel(option.conditionLevel)}
                                                    className="h-11 w-11 object-contain"
                                                />
                                                <span className="text-xs font-bold">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <QuickField label="행동 패턴">
                                    <input
                                        name="behaviorPattern"
                                        value={form.behaviorPattern}
                                        onChange={onChange}
                                        className="input"
                                        placeholder="예: 산책 후 잘 쉬었어요"
                                    />
                                </QuickField>
                            </div>
                            <QuickField label="일기 메모">
                                <textarea
                                    name="diaryContent"
                                    value={form.diaryContent}
                                    onChange={onChange}
                                    className="textarea"
                                    placeholder="오늘 감정이나 행동 변화를 짧게 남겨주세요"
                                />
                            </QuickField>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-5">
                            <h3 className="text-2xl font-bold text-gray-950">건강 상태도 같이 남겨볼까요?</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <QuickField label="몸무게">
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="weight"
                                        value={form.weight}
                                        onChange={onChange}
                                        className="input"
                                        placeholder="5.8kg"
                                    />
                                </QuickField>
                                <QuickField label="건강 상태">
                                    <select
                                        name="healthStatus"
                                        value={form.healthStatus}
                                        onChange={onChange}
                                        className="input"
                                    >
                                        {Object.entries(healthLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </QuickField>
                            </div>
                            <QuickField label="증상">
                                <input
                                    name="symptoms"
                                    value={form.symptoms}
                                    onChange={onChange}
                                    className="input"
                                    placeholder="예: 특이 증상 없음"
                                />
                            </QuickField>
                            <QuickField label="건강 메모">
                                <textarea
                                    name="memo"
                                    value={form.memo}
                                    onChange={onChange}
                                    className="textarea"
                                    placeholder="오늘 건강 상태를 짧게 남겨주세요"
                                />
                            </QuickField>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-[1fr_1fr] gap-3 sm:grid-cols-[120px_1fr_160px]">
                    <button
                        type="button"
                        onClick={isFirstStep ? onClose : onPrev}
                        className="h-12 border border-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                    >
                        {isFirstStep ? "닫기" : "이전"}
                    </button>
                    <div className="hidden sm:block" />
                    <button
                        type="button"
                        onClick={isLastStep ? onSubmit : onNext}
                        disabled={isSubmitting}
                        className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isSubmitting ? "저장 중..." : isLastStep ? "저장" : "다음"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuickStepIndicator({ step }) {
    return (
        <div className="mt-6 grid grid-cols-3 gap-2">
            {quickSteps.map((item, index) => {
                const active = step === index;
                const done = step > index;

                return (
                    <div
                        key={item.key}
                        className={`h-2 rounded-full ${
                            active || done ? "bg-black" : "bg-gray-200"
                        }`}
                        aria-label={item.label}
                    />
                );
            })}
        </div>
    );
}

function QuickField({ label, children }) {
    return (
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}

// 산책 기록 영역
