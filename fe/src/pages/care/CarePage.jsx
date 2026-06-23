// 반려견 케어 관리 페이지

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/layout/Header";
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
} from "../../api/care";
import { getDogs } from "../../api/dog";
import { getAccessToken } from "../../utils/token";

import {
    initialEmotionForm,
    initialHealthForm,
    initialQuickRecordForm,
    initialWalkForm,
    quickEmotionOptions,
    quickSteps,
    today,
} from "../../constants/carePage";
import { getCurrentDatetimeLocalValue, getReviewRange, normalizeCareTab, toDatetimeLocalValue } from "../../utils/careDate";
import { CareSummary, CareTabs, CareTrendPanel, QuickRecordBanner } from "../../components/care/CareOverview";
import { ReviewSection } from "../../components/care/CareReviewSection";
import { QuickRecordModal } from "../../components/care/QuickRecordModal";
import { AnalysisSection, EmotionSection, HealthSection, WalkSection } from "../../components/care/CareRecordSections";

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
        const timerId = window.setTimeout(() => {
            setActiveTab(requestedTab);
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
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