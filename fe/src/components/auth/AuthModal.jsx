// 로그인 및 회원가입 모달

import { useState } from "react";
import { redirectToOAuth } from "../../api/auth";
import { useModalClose } from "../../hooks/useModalClose";

export default function AuthModal({ onClose }) {

    // 현재 탭 상태 (login | signup)
    const [mode, setMode] = useState("login");
    const { isClosing, handleClose } = useModalClose(onClose);

    // 버튼 공통 애니메이션
    const buttonEffect =
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]";
    return (

        // 모달 배경
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${
                isClosing
                    ? "pointer-events-none animate-[overlayFadeOut_0.16s_ease-in_forwards]"
                    : "animate-[overlayFadeIn_0.16s_ease-out]"
            }`}
            onClick={handleClose}
        >

            {/* 모달 본체 */}
            <div className={`relative w-[520px] rounded-3xl bg-white p-8 shadow-xl ${
                    isClosing
                        ? "animate-[modalFadeOut_0.16s_ease-in_forwards]"
                        : "animate-[modalFadeIn_0.18s_ease-out]"
                }`}
                onClick={(e) => e.stopPropagation()}
            >

                {/* 닫기 버튼 */}
                <button onClick={handleClose}
                    className="absolute right-6 top-6 text-2xl text-gray-400 transition hover:scale-110 hover:text-black"
                >
                    ×
                </button>

                {/* 모달 제목 */}
                <h2 className="mb-6 text-3xl font-bold">
                    {mode === "login" ? "시작하기" : "회원가입"}
                </h2>

                {/* 로그인 / 회원가입 탭 */}
                <div className="mb-6 grid grid-cols-2 rounded-full bg-gray-100 p-1">
                    <button onClick={() => setMode("login")}
                        className={`rounded-full py-2 text-sm font-semibold transition ${
                            mode === "login"
                                ? "bg-white shadow"
                                : "text-gray-500"
                        }`}
                    >
                        로그인
                    </button>

                    <button onClick={() => setMode("signup")}
                        className={`rounded-full py-2 text-sm font-semibold transition ${
                            mode === "signup"
                                ? "bg-white shadow"
                                : "text-gray-500"
                        }`}
                    >
                        회원가입
                    </button>
                </div>

                {/* 로그인 화면 */}
                {mode === "login" ? (
                    <div className="flex flex-col gap-3">
                        {/* 이메일 */}
                        <input className="h-12 rounded-xl border px-4"
                            placeholder="이메일"
                        />

                        {/* 비밀번호 */}
                        <input className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호"
                            type="password"
                        />

                        {/* 일반 로그인 */}
                        <button className={`h-12 rounded-xl bg-black font-semibold text-white ${buttonEffect}`}
                        >
                            로그인
                        </button>

                        {/* 간편 로그인 구분선 */}
                        <div className="my-5 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-sm text-gray-400">간편 로그인</span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        {/* 소셜 로그인 아이콘 버튼 */}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => redirectToOAuth("kakao")}
                                className={`flex h-14 items-center justify-center rounded-2xl bg-[#FEE500] text-xl font-bold text-black ${buttonEffect}`}
                            >
                                💛
                            </button>

                            <button onClick={() => redirectToOAuth("naver")}
                                className={`flex h-14 items-center justify-center rounded-2xl bg-[#03C75A] text-xl font-bold text-white ${buttonEffect}`}
                            >
                                N
                            </button>

                            <button onClick={() => redirectToOAuth("google")}
                                className={`flex h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-xl font-bold text-blue-500 ${buttonEffect}`}
                            >
                                G
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 회원가입 화면 */
                    <div className="flex flex-col gap-3">
                        <input
                            className="h-12 rounded-xl border px-4"
                            placeholder="이메일"
                        />
                        <input
                            className="h-12 rounded-xl border px-4"
                            placeholder="닉네임"
                        />
                        <input
                            className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호"
                            type="password"
                        />
                        <input
                            className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호 확인"
                            type="password"
                        />
                        <button className={`mt-2 h-14 rounded-xl bg-black font-semibold text-white ${buttonEffect}`}>
                            회원가입
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
