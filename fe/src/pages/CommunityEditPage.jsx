// 커뮤니티 게시글 수정 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import { getCommunityPost, updateCommunityPost } from "../api/community";
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
    dogId: "",
    category: "DAILY",
    title: "",
    content: "",
};

export default function CommunityEditPage() {
    const navigate = useNavigate();
    const { communityPostId } = useParams();
    const { member } = useAuth();

    const isAdmin = member?.role === "ADMIN";
    const visibleCategories = isAdmin ? categories : categories.filter((category) => category.value !== "NOTICE");

    // 게시글 수정 폼 상태
    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 게시글 상세 조회
    const fetchPost = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getCommunityPost(communityPostId);
            const post = response.data;

            setForm({
                dogId: post.dogId || "",
                category: post.category || "DAILY",
                title: post.title || "",
                content: post.content || "",
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "커뮤니티 게시글 조회에 실패했습니다.");
            navigate("/community");
        } finally {
            setIsLoading(false);
        }
    }, [communityPostId, navigate]);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        fetchPost();
    }, [fetchPost, navigate]);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 게시글 수정
    const handleSubmit = async (event) => {
        event.preventDefault();

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

            await updateCommunityPost(communityPostId, {
                dogId: form.dogId ? Number(form.dogId) : null,
                category: form.category,
                title: form.title.trim(),
                content: form.content.trim(),
            });

            alert("게시글이 수정되었습니다.");
            navigate(`/community/${communityPostId}`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "게시글 수정에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        게시글을 불러오는 중...
                    </div>
                ) : (
                    <>
                        <section className="border-b border-gray-100 px-8 py-14">
                            <div className="mx-auto max-w-5xl">
                                <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                                    COMMUNITY
                                </p>
                                <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                                    커뮤니티 글 수정
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                    작성한 커뮤니티 게시글의 제목과 내용을 수정할 수 있습니다.
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
                                        onClick={() => navigate(`/community/${communityPostId}`)}
                                        className="h-12 border border-gray-200 px-7 text-sm font-bold transition hover:bg-gray-50"
                                    >
                                        취소
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-12 bg-black px-7 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {isSubmitting ? "수정 중..." : "수정"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </>
                )}
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
