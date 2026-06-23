// OAuth 추가 정보 입력 페이지

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import RegionSelect from "../../components/common/RegionSelect";
import { completeProfile, getMyInfo } from "../../api/member";
import { getAccessToken } from "../../utils/token";
import { isCompleteRegionValue } from "../../constants/regions";

const initialForm = {
    realName: "",
    nickname: "",
    phoneNumber: "",
    region: "",
    introduction: "",
};

export default function OAuth2ProfileCompletePage() {
    const navigate = useNavigate();

    // 입력 폼 상태
    const [form, setForm] = useState(initialForm);

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // OAuth 임시 회원 정보 조회
    useEffect(() => {
        const fetchMember = async () => {
            if (!getAccessToken()) {
                alert("로그인이 필요합니다.");
                navigate("/");
                return;
            }

            try {
                const response = await getMyInfo();
                const member = response.data;

                if (member.status !== "PENDING") {
                    navigate("/profile-complete", { replace: true });
                    return;
                }

                setForm({
                    realName: "",
                    nickname: "",
                    phoneNumber: "",
                    region: "",
                    introduction: "",
                });
            } catch (error) {
                console.error(error);
                alert(error.response?.data?.message || "회원 정보를 불러오지 못했습니다.");
                navigate("/");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMember();
    }, [navigate]);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // OAuth 추가 정보 제출
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.realName.trim()) {
            alert("실명을 입력해주세요.");
            return;
        }

        if (!form.nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        if (!form.region.trim()) {
            alert("거주 지역을 입력해주세요.");
            return;
        }

        if (!isCompleteRegionValue(form.region)) {
            alert("거주 지역은 시/도와 시/군/구를 모두 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await completeProfile({
                realName: form.realName.trim(),
                nickname: form.nickname.trim(),
                phoneNumber: form.phoneNumber.trim(),
                region: form.region.trim(),
                introduction: form.introduction.trim(),
            });

            alert("추가 정보 입력이 완료되었습니다.");
            navigate("/", { replace: true });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "추가 정보 입력에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-4xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            OAUTH SIGNUP
                        </p>
                        <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                            산책을 시작하기 전
                            <br/>
                            필수 정보를 입력해주세요
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                            SNS 계정으로 로그인했지만, Tail & Tale에서 사용할 실명과 닉네임,
                            <br/>
                            거주 지역은 한 번 더 확인이 필요합니다.
                        </p>
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        추가 정보 입력 화면을 준비하는 중...
                    </div>
                ) : (
                    <section className="mx-auto grid max-w-4xl gap-8 px-8 py-12 lg:grid-cols-[1fr_360px]">
                        <form onSubmit={handleSubmit} className="border border-gray-200 p-6">
                            <div className="mb-6">
                                <p className="text-sm font-bold tracking-[0.3em] text-gray-400">
                                    REQUIRED INFO
                                </p>
                                <h2 className="mt-3 text-2xl font-bold text-gray-950">
                                    기본 정보 입력
                                </h2>
                            </div>

                            <div className="grid gap-4">
                                <Field label="실명" required>
                                    <input name="realName"
                                        value={form.realName}
                                        onChange={handleChange}
                                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="실명을 입력해주세요"
                                    />
                                </Field>

                                <Field label="닉네임" required>
                                    <input name="nickname"
                                        value={form.nickname}
                                        onChange={handleChange}
                                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="서비스에서 사용할 닉네임"
                                    />
                                </Field>

                                <Field label="거주 지역" required>
                                    <RegionSelect
                                        value={form.region}
                                        onChange={(region) => setForm((prevForm) => ({ ...prevForm, region }))}
                                    />
                                </Field>

                                <Field label="전화번호">
                                    <input name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                        placeholder="01012345678"
                                    />
                                </Field>

                                <Field label="자기소개">
                                    <textarea name="introduction"
                                        value={form.introduction}
                                        onChange={handleChange}
                                        className="min-h-28 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                                        placeholder="간단한 자기소개를 입력해주세요"
                                    />
                                </Field>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-6 h-12 w-full bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? "완료 처리 중..." : "추가 정보 입력 완료"}
                            </button>
                        </form>

                        <aside className="h-fit border border-gray-200 bg-gray-50 p-6">
                            <p className="text-sm font-bold text-gray-400">시작하기 전 확인</p>
                            <div className="mt-5 grid gap-4 text-sm leading-6 text-gray-600">
                                <p>
                                    안전한 산책 모임을 위해
                                    <br/>
                                    실명, 닉네임, 거주 지역을 확인하고 있습니다.
                                </p>
                                <p>
                                    입력이 완료되면 산책 모집,
                                    <br/>
                                    참여 신청, 채팅 기능을 이용할 수 있습니다.
                                </p>
                            </div>
                        </aside>
                    </section>
                )}
            </main>
        </>
    );
}

// 입력 필드
function Field({ label, required = false, children }) {
    return (
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            <span>
                {label}
                {required && <span className="ml-1 text-emerald-600">필수</span>}
            </span>
            {children}
        </label>
    );
}
