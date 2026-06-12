import { useState } from "react";
import Header from "../components/layout/Header";
import AuthModal from "../components/auth/AuthModal";

// 메인 랜딩 페이지

export default function HomePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Header
                onLoginClick={() => setIsModalOpen(true)}
            />

            <main className="pt-20">
                <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
                    <h1 className="mb-6 text-6xl font-bold text-gray-900">
                        반려견과의 이야기를
                        <br />
                        기록하고 공유하세요
                    </h1>

                    <p className="max-w-2xl text-lg text-gray-500">
                        산책 기록, 추억, 건강 관리까지.
                        우리 아이의 하루를 특별하게 남겨보세요.
                    </p>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-10 rounded-full bg-black px-8 py-4 text-white transition hover:opacity-80"
                    >
                        시작하기
                    </button>
                </section>
            </main>

            {isModalOpen && (
                <AuthModal
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}