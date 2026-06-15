// 내 반려견 관리 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { deleteDog, getDog, getDogs, registerDog, updateDog, verifyDog } from "../api/dog";
import { getAccessToken } from "../utils/token";

const initialForm = {
    name: "",
    breed: "",
    gender: "UNKNOWN",
    birthDate: "",
    weight: "",
    size: "",
    personality: "",
    profileImageUrl: "",
    isNeutered: false,
    note: "",
};

const MAX_DOG_WEIGHT = 999.99;

export default function DogsPage() {
    const navigate = useNavigate();

    // 반려견 목록 및 선택 상태
    const [dogs, setDogs] = useState([]);
    const [selectedDog, setSelectedDog] = useState(null);

    // 입력 폼 상태
    const [form, setForm] = useState(initialForm);
    const [editDogId, setEditDogId] = useState(null);

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [animalRegistrationNumber, setAnimalRegistrationNumber] = useState("");

    // 반려견 상세 조회
    const fetchDogDetail = useCallback(async (dogId) => {
        try {
            const response = await getDog(dogId);
            setSelectedDog(response.data);
            setAnimalRegistrationNumber(response.data.animalRegistrationNumber || "");
        } catch (error) {
            console.error(error);
            alert("반려견 상세 조회에 실패했습니다.");
        }
    }, []);

    // 내 반려견 목록 조회
    const fetchDogs = useCallback(async () => {
        try {
            const response = await getDogs();
            setDogs(response.data);

            if (response.data.length > 0) {
                await fetchDogDetail(response.data[0].dogId);
            } else {
                setSelectedDog(null);
            }
        } catch (error) {
            console.error(error);
            alert("반려견 목록 조회에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchDogDetail]);

    // 비로그인 접근 방지 및 목록 조회
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
        const { name, value, type, checked } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // API 요청 데이터 생성
    const createPayload = () => ({
        name: form.name.trim(),
        breed: form.breed.trim(),
        gender: form.gender,
        birthDate: form.birthDate || null,
        weight: form.weight ? Number(form.weight) : null,
        size: form.size || null,
        personality: form.personality.trim(),
        profileImageUrl: form.profileImageUrl.trim(),
        isNeutered: form.isNeutered,
        note: form.note.trim(),
    });

    // 입력값 검증
    const validateForm = () => {
        const weight = Number(form.weight);
        const today = new Date();
        const birthDate = form.birthDate ? new Date(form.birthDate) : null;

        today.setHours(0, 0, 0, 0);

        if (!form.name.trim()) {
            return "반려견 이름을 입력해주세요.";
        }

        if (form.weight && (Number.isNaN(weight) || weight <= 0)) {
            return "몸무게는 0보다 큰 값으로 입력해주세요.";
        }

        if (form.weight && weight > MAX_DOG_WEIGHT) {
            return `몸무게는 ${MAX_DOG_WEIGHT}kg 이하로 입력해주세요.`;
        }

        if (birthDate && birthDate > today) {
            return "생년월일은 오늘 이후 날짜를 선택할 수 없습니다.";
        }

        return null;
    };

    // 입력 폼 초기화
    const resetForm = () => {
        setForm(initialForm);
        setEditDogId(null);
    };

    // 반려견 등록 및 수정
    const handleSubmit = async (event) => {
        event.preventDefault();

        const errorMessage = validateForm();

        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = createPayload();
            const response = editDogId
                ? await updateDog(editDogId, payload)
                : await registerDog(payload);

            alert(editDogId ? "반려견 정보가 수정되었습니다." : "반려견이 등록되었습니다.");
            resetForm();
            await fetchDogs();
            await fetchDogDetail(response.data.dogId);
        } catch (error) {
            console.error(error);
            alert(editDogId ? "반려견 정보 수정에 실패했습니다." : "반려견 등록에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 수정 모드 시작
    const startEdit = (dog) => {
        setEditDogId(dog.dogId);
        setForm({
            name: dog.name || "",
            breed: dog.breed || "",
            gender: dog.gender || "UNKNOWN",
            birthDate: dog.birthDate || "",
            weight: dog.weight ?? "",
            size: dog.size || "",
            personality: dog.personality || "",
            profileImageUrl: dog.profileImageUrl || "",
            isNeutered: Boolean(dog.isNeutered),
            note: dog.note || "",
        });
    };

    // 반려견 삭제
    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            await deleteDog(deleteTarget.dogId);

            alert("반려견 정보가 삭제되었습니다.");
            setDeleteTarget(null);
            resetForm();
            await fetchDogs();
        } catch (error) {
            console.error(error);
            alert("반려견 삭제에 실패했습니다.");
        }
    };

    // 반려견 인증
    const handleVerify = async () => {
        if (!selectedDog) {
            return;
        }

        if (!animalRegistrationNumber.trim()) {
            alert("동물등록번호를 입력해주세요.");
            return;
        }

        try {
            setIsVerifying(true);

            const response = await verifyDog(selectedDog.dogId, {
                animalRegistrationNumber: animalRegistrationNumber.trim(),
            });

            alert("반려견 인증이 완료되었습니다.");
            setSelectedDog(response.data);
            await fetchDogs();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "반려견 인증에 실패했습니다.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gray-50 px-6 pb-16 pt-28">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[420px_1fr]">

                    {/* 반려견 등록 및 수정 폼 */}
                    <section className="rounded-3xl bg-white p-7 shadow-sm">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {editDogId ? "반려견 수정" : "반려견 등록"}
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    함께할 반려견 정보를 입력해주세요.
                                </p>
                            </div>

                            {editDogId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm transition hover:bg-gray-50"
                                >
                                    취소
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                            {/* 이름 */}
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                이름
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    placeholder="예: 초코"
                                />
                            </label>

                            {/* 견종 */}
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                견종
                                <input
                                    name="breed"
                                    value={form.breed}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    placeholder="예: 푸들"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">

                                {/* 성별 */}
                                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                    성별
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    >
                                        <option value="UNKNOWN">모름</option>
                                        <option value="MALE">수컷</option>
                                        <option value="FEMALE">암컷</option>
                                    </select>
                                </label>

                                {/* 크기 */}
                                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                    크기
                                    <select
                                        name="size"
                                        value={form.size}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    >
                                        <option value="">선택 안 함</option>
                                        <option value="SMALL">소형</option>
                                        <option value="MEDIUM">중형</option>
                                        <option value="LARGE">대형</option>
                                    </select>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                {/* 생년월일 */}
                                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                    생년월일
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={form.birthDate}
                                        onChange={handleChange}
                                        max={getTodayDate()}
                                        className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    />
                                </label>

                                {/* 몸무게 */}
                                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                    몸무게
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={MAX_DOG_WEIGHT}
                                        name="weight"
                                        value={form.weight}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                        placeholder="kg"
                                    />
                                </label>
                            </div>

                            {/* 성향 */}
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                성향
                                <input
                                    name="personality"
                                    value={form.personality}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    placeholder="예: 사람을 좋아하고 활발합니다"
                                />
                            </label>

                            {/* 프로필 이미지 URL */}
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                프로필 이미지 URL
                                <input
                                    name="profileImageUrl"
                                    value={form.profileImageUrl}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                                    placeholder="https://example.com/dog.jpg"
                                />
                            </label>

                            {/* 중성화 여부 */}
                            <label className="flex h-12 items-center justify-between rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700">
                                중성화 완료
                                <input
                                    type="checkbox"
                                    name="isNeutered"
                                    checked={form.isNeutered}
                                    onChange={handleChange}
                                    className="h-5 w-5 accent-black"
                                />
                            </label>

                            {/* 특이사항 */}
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                특이사항
                                <textarea
                                    name="note"
                                    value={form.note}
                                    onChange={handleChange}
                                    className="min-h-24 resize-none rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black"
                                    placeholder="건강, 성격, 산책 시 주의사항 등을 입력해주세요"
                                />
                            </label>

                            {/* 저장 버튼 */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 h-14 rounded-xl bg-black font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? "저장 중..." : editDogId ? "수정하기" : "등록하기"}
                            </button>
                        </form>
                    </section>

                    {/* 반려견 목록 및 상세 */}
                    <section className="flex flex-col gap-6">
                        <div className="rounded-3xl bg-white p-7 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">내 반려견</h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        등록한 반려견을 선택해 상세 정보를 확인하세요.
                                    </p>
                                </div>

                                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                                    {dogs.length}마리
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="flex h-36 items-center justify-center text-gray-400">
                                    불러오는 중...
                                </div>
                            ) : dogs.length === 0 ? (
                                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    등록된 반려견이 없습니다.
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {dogs.map((dog) => (
                                        <button
                                            key={dog.dogId}
                                            type="button"
                                            onClick={() => fetchDogDetail(dog.dogId)}
                                            className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-black ${
                                                selectedDog?.dogId === dog.dogId
                                                    ? "border-black bg-gray-50 shadow-sm ring-2 ring-black"
                                                    : "border-gray-200 bg-white"
                                            }`}
                                        >
                                            <DogAvatar
                                                dog={dog}
                                                className="h-14 w-14 rounded-2xl text-lg"
                                            />

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-semibold">{dog.name}</p>
                                                    {dog.isVerified && <VerifiedBadge />}
                                                </div>

                                                <p className="mt-1 truncate text-sm text-gray-500">
                                                    {dog.breed || "견종 미입력"}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl bg-white p-7 shadow-sm">
                            <h2 className="mb-5 text-2xl font-bold">상세 정보</h2>

                            {selectedDog ? (
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-start justify-between gap-5">
                                        <div className="flex items-center gap-4">
                                            <DogAvatar
                                                dog={selectedDog}
                                                className="h-20 w-20 rounded-3xl text-2xl"
                                            />

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-2xl font-bold">{selectedDog.name}</h3>
                                                    {selectedDog.isVerified && <VerifiedBadge />}
                                                </div>

                                                <p className="mt-1 text-gray-500">
                                                    {selectedDog.breed || "견종 미입력"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(selectedDog)}
                                                className="h-10 rounded-xl border border-gray-200 px-4 text-sm transition hover:bg-gray-50"
                                            >
                                                수정
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(selectedDog)}
                                                className="h-10 rounded-xl bg-red-50 px-4 text-sm text-red-500 transition hover:bg-red-100"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <DetailItem label="성별" value={formatGender(selectedDog.gender)} />
                                        <DetailItem label="크기" value={formatSize(selectedDog.size)} />
                                        <DetailItem label="생년월일" value={selectedDog.birthDate || "미입력"} />
                                        <DetailItem label="몸무게" value={selectedDog.weight ? `${selectedDog.weight}kg` : "미입력"} />
                                        <DetailItem label="중성화 여부" value={selectedDog.isNeutered ? "완료" : "미완료"} />
                                        <DetailItem label="인증 상태" value={selectedDog.isVerified ? "인증 완료" : "미인증"} />
                                        <DetailItem label="동물등록번호" value={selectedDog.animalRegistrationNumber || "미입력"} />
                                        <DetailItem label="인증 완료일" value={formatDateTime(selectedDog.verifiedAt)} />
                                        <DetailItem label="성향" value={selectedDog.personality || "미입력"} />
                                    </div>

                                    {!selectedDog.isVerified && (
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                                            <p className="text-sm font-bold text-emerald-700">
                                                동물등록번호 인증
                                            </p>

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                                <input
                                                    value={animalRegistrationNumber}
                                                    onChange={(event) => setAnimalRegistrationNumber(event.target.value)}
                                                    className="h-12 flex-1 rounded-xl border border-emerald-100 bg-white px-4 text-base outline-none transition focus:border-emerald-500"
                                                    placeholder="동물등록번호를 입력해주세요"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={handleVerify}
                                                    disabled={isVerifying}
                                                    className="h-12 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                >
                                                    {isVerifying ? "인증 중..." : "인증하기"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <DetailItem label="특이사항" value={selectedDog.note || "미입력"} />
                                </div>
                            ) : (
                                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    반려견을 선택해주세요.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* 삭제 확인 모달 */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
                        <h2 className="text-xl font-bold">
                            반려견 정보를 삭제할까요?
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            {deleteTarget.name}의 정보가 삭제됩니다.
                            삭제한 정보는 되돌릴 수 없습니다.
                        </p>

                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="h-12 rounded-xl border border-gray-200 text-sm font-semibold transition hover:bg-gray-50"
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="h-12 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// 반려견 이미지
function DogAvatar({ dog, className }) {
    const [hasImageError, setHasImageError] = useState(false);
    const hasImage = dog.profileImageUrl && !hasImageError;

    return (
        <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-gray-100 font-bold text-gray-500 ${className}`}>
            {hasImage ? (
                <img
                    src={dog.profileImageUrl}
                    alt={dog.name}
                    onError={() => setHasImageError(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span>{dog.name?.slice(0, 1) || "D"}</span>
            )}
        </div>
    );
}

// 상세 정보 항목
function DetailItem({ label, value }) {
    return (
        <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-400">{label}</p>
            <p className="mt-2 break-words text-sm font-medium text-gray-800">{value}</p>
        </div>
    );
}

// 인증 뱃지
function VerifiedBadge() {
    return (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
            인증
        </span>
    );
}

// 성별 표시
function formatGender(gender) {
    if (gender === "MALE") return "수컷";
    if (gender === "FEMALE") return "암컷";
    return "모름";
}

// 크기 표시
function formatSize(size) {
    if (size === "SMALL") return "소형";
    if (size === "MEDIUM") return "중형";
    if (size === "LARGE") return "대형";
    return "미입력";
}

// 날짜 시간 표시
function formatDateTime(dateTime) {
    if (!dateTime) {
        return "미인증";
    }

    return dateTime.replace("T", " ").slice(0, 16);
}

// 오늘 날짜
function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}
