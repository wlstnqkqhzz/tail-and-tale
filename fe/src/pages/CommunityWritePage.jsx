// 커뮤니티 게시글 작성 페이지

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { createCommunityPost } from "../api/community";
import { getAccessToken } from "../utils/token";
import { useAuth } from "../hooks/useAuth";

const categories = [
    { value: "DAILY", label: "일상" },
    { value: "WALK_REVIEW", label: "산책 후기" },
    { value: "CARE_INFO", label: "케어 정보" },
    { value: "QUESTION", label: "질문" },
    { value: "NOTICE", label: "공지" },
];

const initialForm = {
    category: "DAILY",
    title: "",
    content: "",
};

export default function CommunityWritePage() {
    const navigate = useNavigate();
    const { member } = useAuth();

    const isAdmin = member?.role === "ADMIN";
    const visibleCategories = isAdmin ? categories : categories.filter((category) => category.value !== "NOTICE");

    // 게시글 작성 폼 상태
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 게시글 작성
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        if (form.category === "NOTICE" && !isAdmin) {
            alert("공지는 관리자만 작성할 수 있습니다.");
            return;
        }

        if (!form.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }

        if (!form.content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await createCommunityPost({
                dogId: null,
                category: form.category,
                title: form.title.trim(),
                content: form.content.trim(),
            });

            alert("게시글이 등록되었습니다.");

            navigate(`/community/${response.data.communityPostId}`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "게시글 등록에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-5xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            COMMUNITY
                        </p>
                        <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                            커뮤니티 글쓰기
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                            반려견과의 일상, 산책 후기, 케어 정보를 자유롭게 공유해보세요.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-5xl px-8 py-10">
                    <form onSubmit={handleSubmit} className="border-y border-gray-200 py-8">
                        <div className="grid gap-6">
                            <Field label="카테고리">
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                >
                                    {visibleCategories.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="제목">
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    placeholder="제목을 입력해주세요."
                                    maxLength={150}
                                />
                            </Field>

                            <Field label="내용">
                                <textarea
                                    name="content"
                                    value={form.content}
                                    onChange={handleChange}
                                    className="min-h-80 resize-none border border-gray-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-black"
                                    placeholder="내용을 입력해주세요."
                                />
                            </Field>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/community")}
                                className="h-12 border border-gray-200 px-7 text-sm font-bold transition hover:bg-gray-50"
                            >
                                취소
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 bg-black px-7 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? "등록 중..." : "등록"}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </>
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
