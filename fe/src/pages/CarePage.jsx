// 반려견 케어 관리 페이지

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    createAiAnalysis,
    createEmotionDiary,
    createHealthRecord,
    createWalkRecord,
    deleteEmotionDiary,
    deleteHealthRecord,
    deleteWalkRecord,
    getAiAnalyses,
    getCareSummary,
    getEmotionDiaries,
    getHealthRecords,
    getWalkRecords,
    updateEmotionDiary,
    updateHealthRecord,
    updateWalkRecord,
} from "../api/care";
import { getDogs } from "../api/dog";
import { getConditionIcon, getConditionLabel } from "../constants/conditionIcons";
import { getAccessToken } from "../utils/token";
import ReactMarkdown from "react-markdown";

const today = new Date().toISOString().slice(0, 10);

const initialEmotionForm = {
    dogId: "",
    walkRecordId: "",
    recordedDate: today,
    emotion: "UNKNOWN",
    conditionLevel: "3",
    behaviorPattern: "",
    diaryContent: "",
};

const initialWalkForm = {
    dogId: "",
    startedAt: `${today}T19:00`,
    endedAt: "",
    durationMinutes: "",
    distanceKm: "",
    routeSummary: "",
    memo: "",
    conditionAfterWalk: "NORMAL",
};

const initialHealthForm = {
    dogId: "",
    recordedDate: today,
    weight: "",
    healthStatus: "NORMAL",
    symptoms: "",
    memo: "",
};

const initialQuickRecordForm = {
    hasWalk: "yes",
    durationMinutes: "45",
    distanceKm: "",
    conditionAfterWalk: "GOOD",
    emotion: "HAPPY",
    conditionLevel: "5",
    behaviorPattern: "",
    diaryContent: "",
    weight: "",
    healthStatus: "GOOD",
    symptoms: "",
    memo: "",
};

const quickSteps = [
    { key: "walk", label: "산책" },
    { key: "emotion", label: "감정" },
    { key: "health", label: "건강" },
];

const quickEmotionOptions = [
    { value: "SAD", label: "슬픔", conditionLevel: "1" },
    { value: "UNKNOWN", label: "보통", conditionLevel: "2" },
    { value: "CALM", label: "평온함", conditionLevel: "3" },
    { value: "HAPPY", label: "좋음", conditionLevel: "4" },
    { value: "EXCITED", label: "신남", conditionLevel: "5" },
];

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

const conditionAfterWalkLabels = {
    VERY_GOOD: "매우 좋음",
    GOOD: "좋음",
    NORMAL: "보통",
    TIRED: "피곤함",
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
    {
        key: "walk",
        step: "01",
        label: "산책 기록",
        description: "시간, 거리, 산책 후 상태를 먼저 남겨요.",
    },
    {
        key: "emotion",
        step: "02",
        label: "감정 일기",
        description: "산책 후 감정과 행동 변화를 이어서 적어요.",
    },
    {
        key: "health",
        step: "03",
        label: "건강 체크",
        description: "몸무게와 증상, 건강 상태를 하루 단위로 확인해요.",
    },
    {
        key: "analysis",
        step: "04",
        label: "AI 분석",
        description: "쌓인 기록을 바탕으로 관리 가이드를 확인해요.",
    },
    {
        key: "review",
        step: "05",
        label: "결산",
        description: "주간, 월간 기록을 달력으로 보고 AI 리뷰를 요청해요.",
    },
];

export default function CarePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedTab = normalizeCareTab(searchParams.get("tab"));
    const requestedDogId = searchParams.get("dogId") || "";

    // 케어 데이터 상태
    const [dogs, setDogs] = useState([]);
    const [selectedDogId, setSelectedDogId] = useState("");
    const [walkRecords, setWalkRecords] = useState([]);
    const [emotionDiaries, setEmotionDiaries] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [aiAnalyses, setAiAnalyses] = useState([]);
    const [careSummary, setCareSummary] = useState(null);

    // 화면 및 폼 상태
    const [activeTab, setActiveTab] = useState(requestedTab);
    const [walkForm, setWalkForm] = useState(initialWalkForm);
    const [emotionForm, setEmotionForm] = useState(initialEmotionForm);
    const [healthForm, setHealthForm] = useState(initialHealthForm);
    const [analysisType, setAnalysisType] = useState("CARE_GUIDE");
    const [reviewMode, setReviewMode] = useState("week");
    const [reviewAnchorDate, setReviewAnchorDate] = useState(today);
    const [editWalkRecordId, setEditWalkRecordId] = useState(null);
    const [editEmotionDiaryId, setEditEmotionDiaryId] = useState(null);
    const [editHealthRecordId, setEditHealthRecordId] = useState(null);
    const [quickRecordOpen, setQuickRecordOpen] = useState(false);
    const [quickRecordClosing, setQuickRecordClosing] = useState(false);
    const [quickStep, setQuickStep] = useState(0);
    const [quickRecordForm, setQuickRecordForm] = useState(initialQuickRecordForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedDog = useMemo(
        () => dogs.find((dog) => String(dog.dogId) === selectedDogId),
        [dogs, selectedDogId]
    );

    const reviewRange = useMemo(
        () => getReviewRange(reviewMode, reviewAnchorDate),
        [reviewMode, reviewAnchorDate]
    );

    // 주소 탭 파라미터 반영
    useEffect(() => {
        setActiveTab(requestedTab);
    }, [requestedTab]);

    // 케어 데이터 조회
    const fetchCareData = useCallback(async (dogId) => {
        if (!dogId) {
            return;
        }

        try {
            const [walkResponse, emotionResponse, healthResponse, analysisResponse, summaryResponse] = await Promise.all([
                getWalkRecords({ dogId }),
                getEmotionDiaries({ dogId }),
                getHealthRecords({ dogId }),
                getAiAnalyses({ dogId }),
                getCareSummary({ dogId }),
            ]);

            setWalkRecords(walkResponse.data);
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
            const verifiedDogs = nextDogs.filter((dog) => dog.isVerified);

            if (nextDogs.length === 0) {
                alert("케어 기록을 위해 먼저 반려견을 등록해주세요.");
                navigate("/dogs", { replace: true });
                return;
            }

            if (verifiedDogs.length === 0) {
                alert("케어 기록을 위해 먼저 반려견 인증을 진행해주세요.");
                navigate("/dogs", { replace: true });
                return;
            }

            const firstDogId = verifiedDogs[0] ? String(verifiedDogs[0].dogId) : "";
            const queryDogExists = verifiedDogs.some((dog) => String(dog.dogId) === requestedDogId);
            const nextDogId = queryDogExists ? requestedDogId : firstDogId;

            setDogs(verifiedDogs);
            setSelectedDogId(nextDogId);
            setWalkForm((prevForm) => ({ ...prevForm, dogId: nextDogId }));
            setEmotionForm((prevForm) => ({ ...prevForm, dogId: nextDogId }));
            setHealthForm((prevForm) => ({ ...prevForm, dogId: nextDogId }));

            if (nextDogId) {
                await fetchCareData(nextDogId);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "반려견 목록을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchCareData, navigate, requestedDogId]);

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
        setWalkForm((prevForm) => ({ ...prevForm, dogId }));
        setEmotionForm((prevForm) => ({ ...prevForm, dogId }));
        setHealthForm((prevForm) => ({ ...prevForm, dogId }));
        setEditWalkRecordId(null);
        setEditEmotionDiaryId(null);
        setEditHealthRecordId(null);
        await fetchCareData(dogId);
    };

    // 산책 기록 폼 변경
    const handleWalkChange = (event) => {
        const { name, value } = event.target;

        setWalkForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 감정 폼 변경
    const handleEmotionChange = (event) => {
        const { name, value } = event.target;

        setEmotionForm((prevForm) => ({
            ...prevForm,
            [name]: value,
            ...(name === "emotion"
                ? { conditionLevel: quickEmotionOptions.find((option) => option.value === value)?.conditionLevel || prevForm.conditionLevel }
                : {}),
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

    // 산책 기록 저장
    const handleWalkSubmit = async (event) => {
        event.preventDefault();

        if (!walkForm.dogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                dogId: Number(walkForm.dogId),
                startedAt: walkForm.startedAt,
                endedAt: walkForm.endedAt || null,
                durationMinutes: walkForm.durationMinutes ? Number(walkForm.durationMinutes) : null,
                distanceKm: walkForm.distanceKm ? Number(walkForm.distanceKm) : null,
                routeSummary: walkForm.routeSummary.trim(),
                memo: walkForm.memo.trim(),
                conditionAfterWalk: walkForm.conditionAfterWalk || null,
            };

            if (editWalkRecordId) {
                await updateWalkRecord(editWalkRecordId, payload);
                alert("산책 기록이 수정되었습니다.");
            } else {
                await createWalkRecord(payload);
                alert("산책 기록이 등록되었습니다.");
            }

            resetWalkForm();
            await fetchCareData(walkForm.dogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 기록 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
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
                walkRecordId: emotionForm.walkRecordId ? Number(emotionForm.walkRecordId) : null,
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

    // 오늘 기록 모달 열기
    const openQuickRecord = () => {
        if (!selectedDogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        setQuickRecordForm({
            ...initialQuickRecordForm,
            weight: selectedDog?.weight ? String(selectedDog.weight) : "",
        });
        setQuickRecordClosing(false);
        setQuickStep(0);
        setQuickRecordOpen(true);
    };

    // 오늘 기록 모달 닫기
    const closeQuickRecord = () => {
        if (quickRecordClosing) {
            return;
        }

        setQuickRecordClosing(true);

        window.setTimeout(() => {
            setQuickRecordOpen(false);
            setQuickRecordClosing(false);
            setQuickStep(0);
        }, 160);
    };

    // 오늘 기록 폼 변경
    const handleQuickRecordChange = (event) => {
        const { name, value } = event.target;

        setQuickRecordForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 오늘 감정 선택
    const handleQuickEmotionSelect = (option) => {
        setQuickRecordForm((prevForm) => ({
            ...prevForm,
            emotion: option.value,
            conditionLevel: option.conditionLevel,
        }));
    };

    // 오늘 기록 한 번에 저장
    const handleQuickRecordSubmit = async () => {
        if (!selectedDogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            let walkRecordId = null;

            if (quickRecordForm.hasWalk === "yes") {
                const walkResponse = await createWalkRecord({
                    dogId: Number(selectedDogId),
                    startedAt: getCurrentDatetimeLocalValue(),
                    endedAt: null,
                    durationMinutes: quickRecordForm.durationMinutes ? Number(quickRecordForm.durationMinutes) : null,
                    distanceKm: quickRecordForm.distanceKm ? Number(quickRecordForm.distanceKm) : null,
                    routeSummary: "오늘 산책",
                    memo: "",
                    conditionAfterWalk: quickRecordForm.conditionAfterWalk,
                });

                walkRecordId = walkResponse.data?.walkRecordId || null;
            }

            await createEmotionDiary({
                dogId: Number(selectedDogId),
                walkRecordId,
                recordedDate: today,
                emotion: quickRecordForm.emotion,
                conditionLevel: quickRecordForm.conditionLevel ? Number(quickRecordForm.conditionLevel) : null,
                behaviorPattern: quickRecordForm.behaviorPattern.trim(),
                diaryContent: quickRecordForm.diaryContent.trim(),
            });

            await createHealthRecord({
                dogId: Number(selectedDogId),
                recordedDate: today,
                weight: quickRecordForm.weight ? Number(quickRecordForm.weight) : null,
                healthStatus: quickRecordForm.healthStatus,
                symptoms: quickRecordForm.symptoms.trim(),
                memo: quickRecordForm.memo.trim(),
            });

            alert("오늘 기록이 저장되었습니다.");
            closeQuickRecord();
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "오늘 기록 저장에 실패했습니다.");
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

    // 기간 결산 AI 리뷰 생성
    const handleCreateReviewAnalysis = async () => {
        if (!selectedDogId) {
            alert("반려견을 먼저 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await createAiAnalysis({
                dogId: Number(selectedDogId),
                analysisType: "CARE_GUIDE",
                targetStartDate: reviewRange.startDate,
                targetEndDate: reviewRange.endDate,
            });

            alert(`${reviewMode === "week" ? "주간" : "월간"} 리뷰가 생성되었습니다.`);
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "결산 리뷰 생성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 산책 기록 수정 시작
    const startEditWalk = (record) => {
        setActiveTab("walk");
        setEditWalkRecordId(record.walkRecordId);
        setWalkForm({
            dogId: String(record.dogId),
            startedAt: toDatetimeLocalValue(record.startedAt),
            endedAt: toDatetimeLocalValue(record.endedAt),
            durationMinutes: record.durationMinutes ? String(record.durationMinutes) : "",
            distanceKm: record.distanceKm || "",
            routeSummary: record.routeSummary || "",
            memo: record.memo || "",
            conditionAfterWalk: record.conditionAfterWalk || "NORMAL",
        });
    };

    // 감정 일기 수정 시작
    const startEditEmotion = (diary) => {
        setActiveTab("emotion");
        setEditEmotionDiaryId(diary.emotionDiaryId);
        setEmotionForm({
            dogId: String(diary.dogId),
            walkRecordId: diary.walkRecordId ? String(diary.walkRecordId) : "",
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

    // 산책 기록 삭제
    const handleDeleteWalk = async (walkRecordId) => {
        if (!window.confirm("산책 기록을 삭제할까요?")) {
            return;
        }

        try {
            await deleteWalkRecord(walkRecordId);
            alert("산책 기록이 삭제되었습니다.");
            await fetchCareData(selectedDogId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 기록 삭제에 실패했습니다.");
        }
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

    // 산책 폼 초기화
    const resetWalkForm = () => {
        setEditWalkRecordId(null);
        setWalkForm({
            ...initialWalkForm,
            dogId: selectedDogId,
            startedAt: `${today}T19:00`,
        });
    };

    // 감정 폼 초기화
    const resetEmotionForm = () => {
        setEditEmotionDiaryId(null);
        setEmotionForm({
            ...initialEmotionForm,
            dogId: selectedDogId,
            walkRecordId: "",
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

                        <CareTrendPanel trend={careSummary?.trend} />

                        <QuickRecordBanner
                            selectedDog={selectedDog}
                            onStart={openQuickRecord}
                        />

                        <CareTabs
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />

                        {activeTab === "walk" && (
                            <WalkSection
                                form={walkForm}
                                records={walkRecords}
                                isSubmitting={isSubmitting}
                                isEditing={Boolean(editWalkRecordId)}
                                onChange={handleWalkChange}
                                onSubmit={handleWalkSubmit}
                                onReset={resetWalkForm}
                                onEdit={startEditWalk}
                                onDelete={handleDeleteWalk}
                            />
                        )}

                        {activeTab === "emotion" && (
                            <EmotionSection
                                form={emotionForm}
                                walkRecords={walkRecords}
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

                        {activeTab === "review" && (
                            <ReviewSection
                                mode={reviewMode}
                                range={reviewRange}
                                anchorDate={reviewAnchorDate}
                                emotionDiaries={emotionDiaries}
                                healthRecords={healthRecords}
                                walkRecords={walkRecords}
                                analyses={aiAnalyses}
                                isSubmitting={isSubmitting}
                                onModeChange={setReviewMode}
                                onAnchorDateChange={setReviewAnchorDate}
                                onCreateReview={handleCreateReviewAnalysis}
                            />
                        )}
                    </section>
                )}

                {quickRecordOpen && (
                    <QuickRecordModal
                        form={quickRecordForm}
                        step={quickStep}
                        isClosing={quickRecordClosing}
                        isSubmitting={isSubmitting}
                        selectedDog={selectedDog}
                        onChange={handleQuickRecordChange}
                        onEmotionSelect={handleQuickEmotionSelect}
                        onPrev={() => setQuickStep((prevStep) => Math.max(prevStep - 1, 0))}
                        onNext={() => setQuickStep((prevStep) => Math.min(prevStep + 1, quickSteps.length - 1))}
                        onClose={closeQuickRecord}
                        onSubmit={handleQuickRecordSubmit}
                    />
                )}
            </main>
        </>
    );
}

// 케어 요약
function CareSummary({ summary, selectedDog }) {
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
function CareTrendPanel({ trend }) {
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

function QuickRecordBanner({ selectedDog, onStart }) {
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
function CareTabs({ activeTab, onChange }) {
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
function ReviewSection({
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
function QuickRecordModal({
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
function WalkSection({ form, records, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
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
function EmotionSection({ form, walkRecords, diaries, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
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
function HealthSection({ form, records, isSubmitting, isEditing, onChange, onSubmit, onReset, onEdit, onDelete }) {
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
function AnalysisSection({ analysisType, analyses, isSubmitting, onTypeChange, onCreate }) {
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

function toDatetimeLocalValue(value) {
    return value ? value.slice(0, 16) : "";
}

function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

function getCurrentDatetimeLocalValue() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function toLocalDateString(date) {
    const pad = (value) => String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(dateString, days) {
    const date = parseLocalDate(dateString);
    date.setDate(date.getDate() + days);

    return toLocalDateString(date);
}

function getReviewRange(mode, anchorDate) {
    const anchor = parseLocalDate(anchorDate);

    if (mode === "month") {
        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

        return {
            startDate: toLocalDateString(start),
            endDate: toLocalDateString(end),
        };
    }

    const weekOptions = getMonthWeekOptions(anchorDate.slice(0, 7));
    const selectedWeek = weekOptions.find((option) => (
        anchorDate >= option.startDate && anchorDate <= option.endDate
    )) || weekOptions[0];

    return {
        startDate: selectedWeek.startDate,
        endDate: selectedWeek.endDate,
    };
}

function buildDateRange(startDate, endDate) {
    const dates = [];
    let current = startDate;

    while (current <= endDate) {
        dates.push(current);
        current = addDays(current, 1);
    }

    return dates;
}

function getDateKey(value) {
    return value ? value.slice(0, 10) : "";
}

function groupFirstByDate(records, fieldName) {
    const map = new Map();

    records.forEach((record) => {
        const dateKey = getDateKey(record[fieldName]);

        if (dateKey && !map.has(dateKey)) {
            map.set(dateKey, record);
        }
    });

    return map;
}

function groupManyByDate(records, fieldName) {
    const map = new Map();

    records.forEach((record) => {
        const dateKey = getDateKey(record[fieldName]);

        if (!dateKey) {
            return;
        }

        const currentRecords = map.get(dateKey) || [];
        map.set(dateKey, [...currentRecords, record]);
    });

    return map;
}

function getMondayBasedWeekday(dateString) {
    const day = parseLocalDate(dateString).getDay();

    return day === 0 ? 6 : day - 1;
}

function getMonthWeekOptions(monthValue) {
    const monthStartDate = `${monthValue}-01`;
    const monthStart = parseLocalDate(monthStartDate);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const monthEndDate = toLocalDateString(monthEnd);
    const options = [];
    let currentStartDate = monthStartDate;
    let weekNumber = 1;

    while (currentStartDate <= monthEndDate) {
        const currentWeekday = getMondayBasedWeekday(currentStartDate);
        const daysInThisWeek = weekNumber === 1 ? 7 - currentWeekday : 7;
        const candidateEndDate = addDays(currentStartDate, daysInThisWeek - 1);
        const endDate = candidateEndDate > monthEndDate ? monthEndDate : candidateEndDate;

        options.push({
            weekNumber,
            startDate: currentStartDate,
            endDate,
        });

        currentStartDate = addDays(endDate, 1);
        weekNumber += 1;
    }

    return options;
}

function getSelectedMonthWeekNumber(anchorDate, weekOptions) {
    return weekOptions.find((option) => (
        anchorDate >= option.startDate && anchorDate <= option.endDate
    ))?.weekNumber || weekOptions[0]?.weekNumber || 1;
}

function getReviewStats(days, diariesByDate, walksByDate) {
    const diaries = days
        .map((date) => diariesByDate.get(date))
        .filter(Boolean);
    const walkCount = days.reduce((totalCount, date) => totalCount + (walksByDate.get(date)?.length || 0), 0);

    return {
        recordedDays: diaries.length,
        walkCount,
    };
}

function normalizeCareTab(tab) {
    return tabs.some((item) => item.key === tab) ? tab : "walk";
}
