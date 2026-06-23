// 산책 게시글 작성 페이지

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import RegionSelect from "../../components/common/RegionSelect";
import { getDogs } from "../../api/dog";
import { createWalkSchedule } from "../../api/walk";
import { getAccessToken } from "../../utils/token";
import { isCompleteRegionValue } from "../../constants/regions";

const initialForm = {
    dogId: "",
    title: "",
    description: "",
    region: "",
    meetingPlace: "",
    scheduledAt: "",
    expectedDurationMinutes: "",
    maxParticipants: "2",
    preferredDogSize: "ANY",
};

const WALK_CREATE_NOTICE_KEY = "walkCreateAccessNotice";
const WALK_CREATE_NOTICE_LOCK_KEY = "walkCreateAccessNoticeLock";

export default function WalkCreatePage() {
    const navigate = useNavigate();
    const hasBlockedAccessRef = useRef(false);

    // 작성 입력 상태
    const [form, setForm] = useState(initialForm);
    const [dogs, setDogs] = useState([]);

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const verifiedDogs = dogs.filter((dog) => dog.isVerified);

    // 작성 접근 차단
    const blockWalkCreateAccess = useCallback((message) => {
        if (hasBlockedAccessRef.current || sessionStorage.getItem(WALK_CREATE_NOTICE_LOCK_KEY)) {
            return;
        }

        hasBlockedAccessRef.current = true;
        sessionStorage.setItem(WALK_CREATE_NOTICE_LOCK_KEY, "true");
        sessionStorage.setItem(WALK_CREATE_NOTICE_KEY, message);
        navigate("/dogs", { replace: true });
    }, [navigate]);

    // 내 반려견 목록 조회
    const fetchDogs = useCallback(async () => {
        try {
            const response = await getDogs();
            const nextDogs = response.data;
            const firstVerifiedDog = nextDogs.find((dog) => dog.isVerified);

            setDogs(nextDogs);

            if (firstVerifiedDog) {
                setForm((prevForm) => ({
                    ...prevForm,
                    dogId: String(firstVerifiedDog.dogId),
                }));
                return;
            }

            if (nextDogs.length === 0) {
                blockWalkCreateAccess("산책 글 작성을 위해 먼저 반려견을 등록해주세요.");
                return;
            }

            blockWalkCreateAccess("산책 글 작성을 위해 먼저 반려견 인증을 진행해주세요.");
        } catch (error) {
            console.error(error);
            alert("반려견 목록 조회에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [blockWalkCreateAccess]);

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

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // API 요청 데이터 생성
    const createPayload = () => ({
        dogId: Number(form.dogId),
        title: form.title.trim(),
        description: form.description.trim(),
        region: form.region.trim(),
        meetingPlace: form.meetingPlace.trim(),
        latitude: null,
        longitude: null,
        scheduledAt: form.scheduledAt,
        expectedDurationMinutes: form.expectedDurationMinutes
            ? Number(form.expectedDurationMinutes)
            : null,
        maxParticipants: Number(form.maxParticipants),
        preferredDogSize: form.preferredDogSize || "ANY",
        preferredPersonality: "",
    });

    // 입력값 검증
    const validateForm = () => {
        const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt) : null;
        const maxParticipants = Number(form.maxParticipants);
        const expectedDurationMinutes = Number(form.expectedDurationMinutes);
        const selectedDog = dogs.find((dog) => String(dog.dogId) === form.dogId);

        if (dogs.length === 0) {
            return "산책 글 작성을 위해 먼저 반려견을 등록해주세요.";
        }

        if (verifiedDogs.length === 0) {
            return "산책 글 작성을 위해 먼저 반려견 인증을 진행해주세요.";
        }

        if (!form.dogId || !selectedDog) {
            return "호스트 반려견을 선택해주세요.";
        }

        if (!selectedDog.isVerified) {
            return "인증된 반려견만 산책 글을 작성할 수 있습니다.";
        }

        if (!form.title.trim()) {
            return "산책 제목을 입력해주세요.";
        }

        if (!form.region.trim()) {
            return "산책 지역을 입력해주세요.";
        }

        if (!isCompleteRegionValue(form.region)) {
            return "산책 지역은 시/도와 시/군/구를 모두 선택해주세요.";
        }

        if (!form.meetingPlace.trim()) {
            return "만남 장소를 입력해주세요.";
        }

        if (!scheduledAt) {
            return "산책 예정 일시를 선택해주세요.";
        }

        if (scheduledAt <= new Date()) {
            return "산책 예정 일시는 현재 시간 이후로 선택해주세요.";
        }

        if (!maxParticipants || Number.isNaN(maxParticipants) || maxParticipants < 2) {
            return "최대 참여 인원은 호스트 포함 2명 이상으로 입력해주세요.";
        }

        if (form.expectedDurationMinutes && (Number.isNaN(expectedDurationMinutes) || expectedDurationMinutes < 1)) {
            return "예상 산책 시간은 1분 이상으로 입력해주세요.";
        }

        return null;
    };

    // 산책 게시글 작성
    const handleSubmit = async (event) => {
        event.preventDefault();

        const errorMessage = validateForm();

        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await createWalkSchedule(createPayload());

            alert("산책 게시글이 작성되었습니다.");
            navigate(`/walks/${response.data.walkScheduleId}`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 게시글 작성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-6xl">
                        <button
                            type="button"
                            onClick={() => navigate("/walks")}
                            className="mb-8 text-sm font-bold text-gray-500 transition hover:text-gray-950"
                        >
                            목록으로 돌아가기
                        </button>

                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            NEW WALK
                        </p>
                        <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                            같이 걷고 싶은
                            <br />
                            산책 일정을 작성해보세요
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                            반려견, 만남 장소, 시간을 입력하면 다른 회원들이 상세 페이지에서 참여를 신청할 수 있습니다.
                        </p>
                    </div>
                </section>

                <section className="mx-auto grid max-w-6xl gap-10 px-8 py-12 lg:grid-cols-[1fr_340px]">
                    <form onSubmit={handleSubmit} className="grid gap-8">
                        <FormSection title="기본 정보">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="호스트 반려견">
                                    <select
                                        name="dogId"
                                        value={form.dogId}
                                        onChange={handleChange}
                                        disabled={isLoading || verifiedDogs.length === 0}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
                                    >
                                        {dogs.length === 0 ? (
                                            <option value="">등록된 반려견 없음</option>
                                        ) : verifiedDogs.length === 0 ? (
                                            <option value="">인증된 반려견 없음</option>
                                        ) : dogs.map((dog) => (
                                            <option key={dog.dogId} value={dog.dogId} disabled={!dog.isVerified}>
                                                {dog.name} {dog.isVerified ? "(인증)" : "(미인증)"}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="선호 반려견 크기">
                                    <select
                                        name="preferredDogSize"
                                        value={form.preferredDogSize}
                                        onChange={handleChange}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    >
                                        <option value="ANY">무관</option>
                                        <option value="SMALL">소형</option>
                                        <option value="MEDIUM">중형</option>
                                        <option value="LARGE">대형</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="제목">
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    placeholder="예: 남강공원 저녁 산책 메이트 구해요"
                                />
                            </Field>

                            <Field label="설명">
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="min-h-32 w-full resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                                    placeholder="예: 잔잔한 강변길에서 천천히 걷는 45분 코스입니다. 낯가림이 심하지 않고 천천히 걷는 친구면 좋아요. 물과 배변봉투를 챙겨와 주세요."
                                />
                            </Field>
                        </FormSection>

                        <FormSection title="장소와 시간">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="지역">
                                    <RegionSelect
                                        value={form.region}
                                        onChange={(region) => setForm((prevForm) => ({ ...prevForm, region }))}
                                        selectClassName="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
                                    />
                                </Field>

                                <Field label="만남 장소">
                                    <input
                                        name="meetingPlace"
                                        value={form.meetingPlace}
                                        onChange={handleChange}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="예: 남강공원 정문"
                                    />
                                </Field>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3">
                                <Field label="예정 일시">
                                    <input
                                        type="datetime-local"
                                        name="scheduledAt"
                                        value={form.scheduledAt}
                                        onChange={handleChange}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    />
                                </Field>

                                <Field label="예상 시간">
                                    <input
                                        type="number"
                                        min="1"
                                        name="expectedDurationMinutes"
                                        value={form.expectedDurationMinutes}
                                        onChange={handleChange}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="분"
                                    />
                                </Field>

                                <Field label="최대 참여 인원">
                                    <input
                                        type="number"
                                        min="2"
                                        name="maxParticipants"
                                        value={form.maxParticipants}
                                        onChange={handleChange}
                                        className="h-12 w-full border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="호스트 포함"
                                    />
                                </Field>
                            </div>
                        </FormSection>

                        <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-8">
                            <button
                                type="button"
                                onClick={() => navigate("/walks")}
                                className="h-12 border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
                            >
                                취소
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                                className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? "작성 중..." : "작성 완료"}
                            </button>
                        </div>
                    </form>

                    <aside className="h-fit border border-gray-200 p-6">
                        <p className="text-sm font-bold text-gray-400">작성 전 확인</p>
                        <ul className="mt-5 grid gap-4 text-sm leading-6 text-gray-600">
                            <li>호스트 본인의 반려견만 산책 글에 등록할 수 있습니다.</li>
                            <li>최대 참여 인원은 호스트를 포함한 전체 인원입니다.</li>
                            <li>작성 후 상세 페이지에서 신청자 승인과 거절을 관리할 수 있습니다.</li>
                        </ul>

                        {!isLoading && dogs.length === 0 && (
                            <button
                                type="button"
                                onClick={() => navigate("/dogs")}
                                className="mt-6 h-12 w-full bg-gray-950 text-sm font-bold text-white transition hover:opacity-80"
                            >
                                반려견 등록하러 가기
                            </button>
                        )}

                        {!isLoading && dogs.length > 0 && verifiedDogs.length === 0 && (
                            <button
                                type="button"
                                onClick={() => navigate("/dogs")}
                                className="mt-6 h-12 w-full bg-gray-950 text-sm font-bold text-white transition hover:opacity-80"
                            >
                                반려견 인증하러 가기
                            </button>
                        )}
                    </aside>
                </section>
            </main>
        </>
    );
}

// 작성 영역
function FormSection({ title, children }) {
    return (
        <section className="border-t border-gray-200 pt-8">
            <h2 className="mb-5 text-xl font-bold text-gray-950">{title}</h2>
            <div className="grid gap-5">{children}</div>
        </section>
    );
}

// 입력 필드
function Field({ label, children }) {
    return (
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}
