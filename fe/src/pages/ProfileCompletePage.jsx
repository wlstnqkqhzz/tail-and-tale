// 소셜 로그인 사용자 추가 정보 입력 페이지

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeProfile } from "../api/member";
import { getAccessToken } from "../utils/token";

export default function ProfileCompletePage() {
    const navigate = useNavigate();

    // 추가 정보 입력 폼 상태
    const [form, setForm] = useState({
        realName: "",
        nickname: "",
        phoneNumber: "",
        region: "",
        introduction: "",
    });

    // 저장 요청 상태
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 비로그인 접근 방지
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
        }
    }, [navigate]);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 프로필 완성
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

        try {
            setIsSubmitting(true);

            await completeProfile({
                realName: form.realName.trim(),
                nickname: form.nickname.trim(),
                phoneNumber: form.phoneNumber.trim(),
                region: form.region.trim(),
                introduction: form.introduction.trim(),
            });

            alert("프로필이 완성되었습니다.");
            navigate("/");
        } catch (error) {
            console.error(error);
            alert("프로필 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">

                {/* 페이지 제목 */}
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold">
                        프로필 완성
                    </h1>

                    <p className="text-gray-500">
                        서비스 이용을 위해 추가 정보를 입력해주세요.
                    </p>
                </div>

                {/* 추가 정보 입력 폼 */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* 실명 */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        실명
                        <input
                            name="realName"
                            value={form.realName}
                            onChange={handleChange}
                            className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                            placeholder="실명을 입력해주세요"
                        />
                    </label>

                    {/* 닉네임 */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        닉네임
                        <input
                            name="nickname"
                            value={form.nickname}
                            onChange={handleChange}
                            className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                            placeholder="닉네임을 입력해주세요"
                        />
                    </label>

                    {/* 전화번호 */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        전화번호
                        <input
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                            placeholder="01012345678"
                        />
                    </label>

                    {/* 거주 지역 */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        거주 지역
                        <input
                            name="region"
                            value={form.region}
                            onChange={handleChange}
                            className="h-12 rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                            placeholder="예: 진주"
                        />
                    </label>

                    {/* 자기소개 */}
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        자기소개
                        <textarea
                            name="introduction"
                            value={form.introduction}
                            onChange={handleChange}
                            className="min-h-28 resize-none rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black"
                            placeholder="간단한 자기소개를 입력해주세요"
                        />
                    </label>

                    {/* 완료 버튼 */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4 h-14 rounded-xl bg-black font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isSubmitting ? "저장 중..." : "완료하기"}
                    </button>

                </form>
            </div>
        </div>
    );
}
