// 반려견 케어 관리 페이지

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    createAiAnalysis,
    createEmotionDiary,
    createHealthRecord,
    deleteEmotionDiary,
    deleteHealthRecord,
    getAiAnalyses,
    getCareSummary,
    getEmotionDiaries,
    getHealthRecords,
    updateEmotionDiary,
    updateHealthRecord,
} from "../api/care";
import { getDogs } from "../api/dog";
import { getAccessToken } from "../utils/token";

const today = new Date().toISOString().slice(0, 10);

const initialEmotionForm = {
    dogId: "",
    recordedDate: today,
    emotion: "UNKNOWN",
    conditionLevel: "3",
    behaviorPattern: "",
    diaryContent: "",
};

const initialHealthForm = {
    dogId: "",
    recordedDate: today,
    weight: "",
    healthStatus: "NORMAL",
    symptoms: "",
    memo: "",
};

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

const analysisLabels = {
    WALK_ACTIVITY: "산책 활동 분석",
    EMOTION_PATTERN: "감정 패턴 분석",
    HEALTH_RISK: "건강 위험 분석",
    CARE_GUIDE: "맞춤 관리 가이드",
};

const riskLabels = {
    LOW: "낮음",
    MEDIUM: "보통",
    HIGH: "높음",
};

const tabs = [
    { key: "emotion", label: "감정 일기" },
    { key: "health", label: "건강 체크" },
    { key: "analysis", label: "AI 분석" },
];

export default function CarePage() {
    const navigate = useNavigate();

    // 케어 데이터 상태
    const [dogs, setDogs] = useState([]);
    const [selectedDogId, setSelectedDogId] = useState("");
    const [emotionDiaries, setEmotionDiaries] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [aiAnalyses, setAiAnalyses] = useState([]);
    const [careSummary, setCareSummary] = useState(null);

    // 화면 및 폼 상태
    const [activeTab, setActiveTab] = useState("emotion");
    const [emotionForm, setEmotionForm] = useState(initialEmotionForm);
    const [healthForm, setHealthForm] = useState(initialHealthForm);
    const [analysisType, setAnalysisType] = useState("CARE_GUIDE");
    const [editEmotionDiaryId, setEditEmotionDiaryId] = useState(null);
    const [editHealthRecordId, setEditHealthRecordId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedDog = useMemo(
        () => dogs.find((dog) => String(dog.dogId) === selectedDogId),
        [dogs, selectedDogId]
    );

    // 케어 데이터 조회
    const fetchCareData = useCallback(async (dogId) => {
        if (!dogId) {
            return;
        }

        try {
            const [emotionResponse, healthResponse, analysisResponse, summaryResponse] = await Promise.all([
                getEmotionDiaries({ dogId }),
                getHealthRecords({ dogId }),
                getAiAnalyses({ dogId }),
                getCareSummary({ dogId }),
            ]);

            setEmotionDiaries(emotionResponse.data);
            setHealthRecords(healthResponse.data);
            setAiAnalyses(analysisResponse.data);
            setCareSummary(summaryResponse.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "케어 데이터를 불러오지 못했습니다.");
        }
    }, []);

    // 내 반려견 목록 조회
    const fetchDogs = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getDogs();
            const nextDogs = response.data;
            const firstDogId = nextDogs[0] ? String(nextDogs[0].dogId) : "";

            setDogs(nextDogs);
            setSelectedDogId(firstDogId);
            setEmotionForm((prevForm) => ({ ...prevForm, dogId: firstDogId }));
            setHealthForm((prevForm) => ({ ...prevForm, dogId: firstDogId }));

            if (firstDogId) {
                await fetchCareData(firstDogId);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "반려견 목록을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchCareData]);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            fetchDogs();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchDogs, navigate]);

    // 반려견 선택 변경
    const handleDogChange = async (event) => {
        const dogId = event.target.value;

        setSelectedDogId(dogId);
        setEmotionForm((prevForm) => ({ ...prevForm, dogId }));
        setHealthForm((prevForm) => ({ ...prevForm, dogId }));
        setEditEmotionDiaryId(null);
        setEditHealthRecordId(null);
        await fetchCareData(dogId);
    };

    // 감정 폼 변경
    const handleEmotionChange = (event) => {
        const { name, value } = event.target;

        setEmotionForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 건강 폼 변경
    const handleHealthChange = (event) => {
        const { name, value } = event.target;

        setHealthForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 감정 일기 저장
    const handleEmotionSubmit = async (event) => {
        event.preventDefault();

        if (!emotionForm.dogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                dogId: Number(emotionForm.dogId),
                recordedDate: emotionForm.recordedDate,
                emotion: emotionForm.emotion,
                conditionLevel: emotionForm.conditionLevel ? Number(emotionForm.conditionLevel) : null,
                behaviorPattern: emotionForm.behaviorPattern.trim(),
                diaryContent: emotionForm.diaryContent.trim(),
            };

            if (editEmotionDiaryId) {
                await updateEmotionDiary(editEmotionDiaryId, payload);
                alert("감정 일기가 수정되었습니다.");
            } else {
                await createEmotionDiary(payload);
                alert("감정 일기가 등록되었습니다.");
            }

            resetEmotionForm();
            await fetchCareData(emotionForm.dogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "감정 일기 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 건강 기록 저장
    const handleHealthSubmit = async (event) => {
        event.preventDefault();

        if (!healthForm.dogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                dogId: Number(healthForm.dogId),
                recordedDate: healthForm.recordedDate,
                weight: healthForm.weight ? Number(healthForm.weight) : null,
                healthStatus: healthForm.healthStatus,
                symptoms: healthForm.symptoms.trim(),
                memo: healthForm.memo.trim(),
            };

            if (editHealthRecordId) {
                await updateHealthRecord(editHealthRecordId, payload);
                alert("건강 기록이 수정되었습니다.");
            } else {
                await createHealthRecord(payload);
                alert("건강 기록이 등록되었습니다.");
            }

            resetHealthForm();
            await fetchCareData(healthForm.dogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "건강 기록 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // AI 분석 생성
    const handleCreateAnalysis = async () => {
        if (!selectedDogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await createAiAnalysis({
                dogId: Number(selectedDogId),
                analysisType,
            });

            alert("AI 분석 결과가 생성되었습니다.");
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "AI 분석 생성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 감정 일기 수정 시작
    const startEditEmotion = (diary) => {
        setActiveTab("emotion");
        setEditEmotionDiaryId(diary.emotionDiaryId);
        setEmotionForm({
            dogId: String(diary.dogId),
            recordedDate: diary.recordedDate,
            emotion: diary.emotion,
            conditionLevel: diary.conditionLevel ? String(diary.conditionLevel) : "",
            behaviorPattern: diary.behaviorPattern || "",
            diaryContent: diary.diaryContent || "",
        });
    };

    // 건강 기록 수정 시작
    const startEditHealth = (record) => {
        setActiveTab("health");
        setEditHealthRecordId(record.healthRecordId);
        setHealthForm({
            dogId: String(record.dogId),
            recordedDate: record.recordedDate,
            weight: record.weight || "",
            healthStatus: record.healthStatus || "NORMAL",
            symptoms: record.symptoms || "",
            memo: record.memo || "",
        });
    };

    // 감정 일기 삭제
    const handleDeleteEmotion = async (emotionDiaryId) => {
        if (!window.confirm("감정 일기를 삭제할까요?")) {
            return;
        }

        try {
            await deleteEmotionDiary(emotionDiaryId);
            alert("감정 일기가 삭제되었습니다.");
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "감정 일기 삭제에 실패했습니다.");
        }
    };

    // 건강 기록 삭제
    const handleDeleteHealth = async (healthRecordId) => {
        if (!window.confirm("건강 기록을 삭제할까요?")) {
            return;
        }

        try {
            await deleteHealthRecord(healthRecordId);
            alert("건강 기록이 삭제되었습니다.");
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "건강 기록 삭제에 실패했습니다.");
        }
    };

    // 감정 폼 초기화
    const resetEmotionForm = () => {
        setEditEmotionDiaryId(null);
        setEmotionForm({
            ...initialEmotionForm,
            dogId: selectedDogId,
            recordedDate: today,
        });
    };

    // 건강 폼 초기화
    const resetHealthForm = () => {
        setEditHealthRecordId(null);
        setHealthForm({
            ...initialHealthForm,
            dogId: selectedDogId,
            recordedDate: today,
        });
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            CARE NOTE
                        </p>
                        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-5xl font-bold leading-tight text-gray-950">
                                    감정과 건강 변화를
                                    <br />
                                    매일 기록하세요
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                    반려견의 일일 감정, 컨디션, 건강 상태를 쌓아두고 관리 가이드를 확인할 수 있습니다.
                                </p>
                            </div>

                            <div className="w-full max-w-sm">
                                <label className="grid gap-2 text-sm font-bold text-gray-700">
                                    반려견 선택
                                    <select
                                        value={selectedDogId}
                                        onChange={handleDogChange}
                                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    >
                                        {dogs.map((dog) => (
                                            <option key={dog.dogId} value={dog.dogId}>
                                                {dog.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        케어 데이터를 불러오는 중...
                    </div>
                ) : dogs.length === 0 ? (
                    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-8 py-24 text-center">
                        <h2 className="text-3xl font-bold text-gray-950">먼저 반려견을 등록해주세요</h2>
                        <p className="mt-4 text-sm leading-6 text-gray-500">
                            감정 일기와 건강 체크는 등록된 반려견을 기준으로 작성할 수 있습니다.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/dogs")}
                            className="mt-8 h-12 rounded-full bg-black px-8 text-sm font-bold text-white"
                        >
                            반려견 등록하기
                        </button>
                    </div>
                ) : (
                    <section className="mx-auto max-w-7xl px-8 py-12">
                        <CareSummary summary={careSummary} selectedDog={selectedDog} />

                        <div className="mt-10 border-b border-gray-200">
                            <div className="grid grid-cols-3">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
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

                        {activeTab === "emotion" && (
                            <EmotionSection
                                form={emotionForm}
                                diaries={emotionDiaries}
                                isSubmitting={isSubmitting}
                                isEditing={Boolean(editEmotionDiaryId)}
                                onChange={handleEmotionChange}
                                onSubmit={handleEmotionSubmit}
                                onReset={resetEmotionForm}
                                onEdit={startEditEmotion}
                                onDelete={handleDeleteEmotion}
                            />
                        )}

                        {activeTab === "health" && (
                            <HealthSection
                                form={healthForm}
                                records={healthRecords}
                                isSubmitting={isSubmitting}
                                isEditing={Boolean(editHealthRecordId)}
                                onChange={handleHealthChange}
                                onSubmit={handleHealthSubmit}
                                onReset={resetHealthForm}
                                onEdit={startEditHealth}
                                onDelete={handleDeleteHealth}
                            />
                        )}

                        {activeTab === "analysis" && (
                            <AnalysisSection
                                analysisType={analysisType}
                                analyses={aiAnalyses}
                                isSubmitting={isSubmitting}
                                onTypeChange={setAnalysisType}
                                onCreate={handleCreateAnalysis}
                            />
                        )}
                    </section>
                )}
            </main>
        </>
    );
}

// 케어 요약
function CareSummary({ summary, selectedDog }) {
    const emotionSummary = summary?.emotionSummary;
    const healthSummary = summary?.healthSummary;
    const items = [
        { label: "선택 반려견", value: selectedDog?.name || "-" },
        { label: "감정 기록", value: emotionSummary?.totalCount ?? 0 },
        { label: "평균 컨디션", value: emotionSummary?.averageConditionLevel ? emotionSummary.averageConditionLevel.toFixed(1) : "-" },
        { label: "최근 몸무게", value: healthSummary?.latestWeight ? `${healthSummary.latestWeight}kg` : "-" },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-4">
            {items.map((item) => (
                <div key={item.label} className="flex h-32 flex-col justify-between border border-gray-200 p-5">
                    <p className="text-sm font-bold text-gray-400">{item.label}</p>
                    <p className="truncate text-3xl font-bold text-gray-950">{item.value}</p>
                </div>
            ))}
        </div>
    );
}

// 감정 일기 영역
function EmotionSection({ form, diaries, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
    return (
        <div className="grid gap-8 py-10 lg:grid-cols-[420px_1fr]">
            <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
                <FormTitle label="EMOTION" title={isEditing ? "감정 일기 수정" : "감정 일기 작성"} />
                <div className="grid gap-4">
                    <InputField label="기록일">
                        <input type="date" name="recordedDate" value={form.recordedDate} onChange={onChange} className="input" />
                    </InputField>
                    <InputField label="감정">
                        <select name="emotion" value={form.emotion} onChange={onChange} className="input">
                            {Object.entries(emotionLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </InputField>
                    <InputField label="컨디션 점수">
                        <input type="number" name="conditionLevel" min="1" max="5" value={form.conditionLevel} onChange={onChange} className="input" />
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

            <RecordList emptyText="아직 감정 일기가 없습니다.">
                {diaries.map((diary) => (
                    <RecordCard
                        key={diary.emotionDiaryId}
                        title={`${emotionLabels[diary.emotion]} · ${diary.conditionLevel || "-"}점`}
                        meta={`${diary.recordedDate} · ${diary.dogName}`}
                        content={diary.diaryContent || diary.behaviorPattern || "기록된 내용이 없습니다."}
                        onEdit={() => onEdit(diary)}
                        onDelete={() => onDelete(diary.emotionDiaryId)}
                    />
                ))}
            </RecordList>
        </div>
    );
}

// 건강 기록 영역
function HealthSection({ form, records, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
    return (
        <div className="grid gap-8 py-10 lg:grid-cols-[420px_1fr]">
            <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
                <FormTitle label="HEALTH" title={isEditing ? "건강 기록 수정" : "건강 기록 작성"} />
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
function AnalysisSection({ analysisType, analyses, isSubmitting, onTypeChange, onCreate }) {
    return (
        <div className="grid gap-8 py-10 lg:grid-cols-[420px_1fr]">
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
                        <p className="mt-3 text-sm leading-6 text-gray-500">{analysis.resultContent}</p>
                        <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-6 text-gray-700">
                            {analysis.guideContent}
                        </p>
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
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}

function FormActions({ isSubmitting, isEditing, onReset }) {
    return (
        <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={onReset} className="h-12 border border-gray-200 text-sm font-bold transition hover:bg-gray-50">
                초기화
            </button>
            <button type="submit" disabled={isSubmitting} className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300">
                {isSubmitting ? "저장 중..." : isEditing ? "수정하기" : "등록하기"}
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

function RecordCard({ title, meta, content, onEdit, onDelete }) {
    return (
        <div className="grid gap-4 border border-gray-200 p-5 md:grid-cols-[1fr_auto]">
            <div className="min-w-0">
                <p className="text-sm font-bold text-gray-400">{meta}</p>
                <h3 className="mt-2 text-lg font-bold text-gray-950">{title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{content}</p>
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
