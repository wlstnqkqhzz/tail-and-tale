// 로그인 및 회원가입 모달

import { useState } from "react";
import { redirectToOAuth } from "../../api/auth";
import { login, signup } from "../../api/member";
import RegionSelect from "../common/RegionSelect";
import { isCompleteRegionValue } from "../../constants/regions";
import { useModalClose } from "../../hooks/useModalClose";

export default function AuthModal({ onClose }) {

    // 현재 화면 상태
    const [mode, setMode] = useState("login");
    const { isClosing, handleClose } = useModalClose(onClose);

    // 로그인 폼 상태
    const [loginForm, setLoginForm] = useState({
        email: "",
        password: "",
    });

    // 회원가입 폼 상태
    const [signupForm, setSignupForm] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
        realName: "",
        nickname: "",
        phoneNumber: "",
        region: "",
        introduction: "",
    });

    // 요청 상태
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 버튼 공통 애니메이션
    const buttonEffect =
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]";

    // 로그인 입력값 변경
    const handleLoginChange = (event) => {
        const { name, value } = event.target;

        setLoginForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 회원가입 입력값 변경
    const handleSignupChange = (event) => {
        const { name, value } = event.target;

        setSignupForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 일반 로그인
    const handleLogin = async (event) => {
        event.preventDefault();

        if (!loginForm.email.trim()) {
            alert("이메일을 입력해주세요.");
            return;
        }

        if (!loginForm.password.trim()) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await login({
                email: loginForm.email.trim(),
                password: loginForm.password,
            });

            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "로그인에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 회원가입
    const handleSignup = async (event) => {
        event.preventDefault();

        const validationMessage = validateSignupForm(signupForm);

        if (validationMessage) {
            alert(validationMessage);
            return;
        }

        try {
            setIsSubmitting(true);

            await signup({
                email: signupForm.email.trim(),
                password: signupForm.password,
                realName: signupForm.realName.trim(),
                nickname: signupForm.nickname.trim(),
                phoneNumber: signupForm.phoneNumber.trim(),
                region: signupForm.region.trim(),
                introduction: signupForm.introduction.trim(),
            });

            alert("회원가입이 완료되었습니다. 로그인해주세요.");
            setMode("login");
            setLoginForm({
                email: signupForm.email.trim(),
                password: "",
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "회원가입에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

                {/* 로그인 화면 */}
                {mode === "login" ? (
                    <form onSubmit={handleLogin} className="flex flex-col gap-3">
                        {/* 이메일 */}
                        <input
                            name="email"
                            value={loginForm.email}
                            onChange={handleLoginChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="이메일"
                        />

                        {/* 비밀번호 */}
                        <input
                            name="password"
                            value={loginForm.password}
                            onChange={handleLoginChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호"
                            type="password"
                        />

                        {/* 일반 로그인 */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`h-12 rounded-xl bg-black font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${buttonEffect}`}
                        >
                            {isSubmitting ? "로그인 중..." : "로그인"}
                        </button>

                        {/* 간편 로그인 구분선 */}
                        <div className="my-5 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-sm text-gray-400">간편 로그인</span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        {/* 소셜 로그인 아이콘 버튼 */}
                        <div className="grid grid-cols-3 gap-3">
                            <button type="button" onClick={() => redirectToOAuth("kakao")}
                                className={`flex h-14 items-center justify-center rounded-2xl bg-[#FEE500] text-xl font-bold text-black ${buttonEffect}`}
                            >
                                💛
                            </button>

                            <button type="button" onClick={() => redirectToOAuth("naver")}
                                className={`flex h-14 items-center justify-center rounded-2xl bg-[#03C75A] text-xl font-bold text-white ${buttonEffect}`}
                            >
                                N
                            </button>

                            <button type="button" onClick={() => redirectToOAuth("google")}
                                className={`flex h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-xl font-bold text-blue-500 ${buttonEffect}`}
                            >
                                G
                            </button>
                        </div>

                        {/* 회원가입 이동 */}
                        <div className="mt-6 flex items-center justify-center gap-1 border-t border-gray-100 pt-5 text-sm text-gray-500">
                            <span>아직 회원이 아니세요?</span>
                            <button
                                type="button"
                                onClick={() => setMode("signup")}
                                className="font-semibold text-black transition hover:underline"
                            >
                                회원가입
                            </button>
                        </div>
                    </form>
                ) : (
                    /* 회원가입 화면 */
                    <form onSubmit={handleSignup} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
                        <input
                            name="email"
                            value={signupForm.email}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="이메일"
                            maxLength={100}
                        />
                        <input
                            name="realName"
                            value={signupForm.realName}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="실명"
                            maxLength={20}
                        />
                        <input
                            name="nickname"
                            value={signupForm.nickname}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="닉네임"
                            maxLength={12}
                        />
                        <input
                            name="phoneNumber"
                            value={signupForm.phoneNumber}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="전화번호"
                            maxLength={13}
                        />
                        <input
                            name="region"
                            value={signupForm.region}
                            readOnly
                            className="sr-only"
                            tabIndex={-1}
                        />
                        <RegionSelect
                            value={signupForm.region}
                            onChange={(region) => setSignupForm((prevForm) => ({ ...prevForm, region }))}
                            selectClassName="h-12 rounded-xl border px-4 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
                        />
                        <textarea
                            name="introduction"
                            value={signupForm.introduction}
                            onChange={handleSignupChange}
                            className="min-h-24 resize-none rounded-xl border px-4 py-3"
                            placeholder="자기소개"
                            maxLength={200}
                        />
                        <input
                            name="password"
                            value={signupForm.password}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호 8~20자, 영문+숫자"
                            type="password"
                            maxLength={20}
                        />
                        <input
                            name="passwordConfirm"
                            value={signupForm.passwordConfirm}
                            onChange={handleSignupChange}
                            className="h-12 rounded-xl border px-4"
                            placeholder="비밀번호 확인"
                            type="password"
                            maxLength={20}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`mt-2 h-14 rounded-xl bg-black font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${buttonEffect}`}
                        >
                            {isSubmitting ? "가입 중..." : "회원가입"}
                        </button>

                        {/* 로그인 이동 */}
                        <div className="mt-6 flex items-center justify-center gap-1 border-t border-gray-100 pt-5 text-sm text-gray-500">
                            <span>이미 회원이신가요?</span>
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                className="font-semibold text-black transition hover:underline"
                            >
                                로그인
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function validateSignupForm(form) {
    const email = form.email.trim();
    const realName = form.realName.trim();
    const nickname = form.nickname.trim();
    const phoneNumber = form.phoneNumber.trim();
    const region = form.region.trim();
    const introduction = form.introduction.trim();
    const password = form.password;

    if (!email) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식으로 입력해주세요.";
    if (email.length > 100) return "이메일은 100자 이하로 입력해주세요.";

    if (!realName) return "실명을 입력해주세요.";
    if (realName.length < 2 || realName.length > 20) return "실명은 2자 이상 20자 이하로 입력해주세요.";
    if (!/^[가-힣a-zA-Z\s]+$/.test(realName)) return "실명은 한글 또는 영문으로 입력해주세요.";

    if (!nickname) return "닉네임을 입력해주세요.";
    if (nickname.length < 2 || nickname.length > 12) return "닉네임은 2자 이상 12자 이하로 입력해주세요.";
    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) return "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.";

    if (!phoneNumber) return "전화번호를 입력해주세요.";
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phoneNumber)) return "전화번호 형식이 올바르지 않습니다.";

    if (!region) return "거주 지역을 입력해주세요.";
    if (!isCompleteRegionValue(region)) return "거주 지역은 시/도와 시/군/구를 모두 선택해주세요.";
    if (region.length < 2 || region.length > 30) return "거주 지역은 2자 이상 30자 이하로 입력해주세요.";

    if (!introduction) return "자기소개를 입력해주세요.";
    if (introduction.length < 5 || introduction.length > 200) return "자기소개는 5자 이상 200자 이하로 입력해주세요.";

    if (!password.trim()) return "비밀번호를 입력해주세요.";
    if (password.length < 8 || password.length > 20) return "비밀번호는 8자 이상 20자 이하로 입력해주세요.";
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,20}$/.test(password)) {
        return "비밀번호는 영문과 숫자를 포함해야 합니다.";
    }

    if (password !== form.passwordConfirm) return "비밀번호가 일치하지 않습니다.";

    return "";
}
