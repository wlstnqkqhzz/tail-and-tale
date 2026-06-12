// 소셜 로그인 사용자 추가 정보 입력 페이지

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeProfile } from "../api/member";

export default function ProfileCompletePage() {

    const navigate = useNavigate();

    const [realName, setRealName] = useState("");
    const [nickname, setNickname] = useState("");

    // 프로필 완성
    const handleSubmit = async () => {

        if (!realName.trim()) {
            alert("실명을 입력해주세요.");
            return;
        }

        if (!nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        try {
            await completeProfile({
                realName,
                nickname,
            });

            alert("프로필이 완성되었습니다.");

            navigate("/");

        } catch (error) {
            console.error(error);
            alert("프로필 저장에 실패했습니다.");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 px-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

                <h1 className="mb-2 text-3xl font-bold">
                    프로필 완성
                </h1>

                <p className="mb-8 text-gray-500">
                    서비스 이용을 위해 추가 정보를 입력해주세요.
                </p>

                <div className="flex flex-col gap-4">

                    <input
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                        className="h-12 rounded-xl border px-4"
                        placeholder="실명"
                    />

                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="h-12 rounded-xl border px-4"
                        placeholder="닉네임"
                    />

                    <button
                        onClick={handleSubmit}
                        className="mt-4 h-14 rounded-xl bg-black font-semibold text-white transition hover:opacity-80"
                    >
                        완료하기
                    </button>

                </div>
            </div>
        </div>
    );
}