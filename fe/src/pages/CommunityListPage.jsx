// 커뮤니티 게시글 목록 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import { UserActionTrigger } from "../components/member/UserMiniProfileModal";
import { getCommunityPosts } from "../api/community";
import { getAccessToken } from "../utils/token";

const categories = [
    { value: "", label: "전체" },
    { value: "DAILY", label: "일상" },
    { value: "WALK_REVIEW", label: "산책 후기" },
    { value: "CARE_INFO", label: "케어 정보" },
    { value: "QUESTION", label: "질문" },
    { value: "NOTICE", label: "공지" },
];

const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "views", label: "조회순" },
    { value: "likes", label: "추천순" },
];

const categoryLabels = {
    WALK_REVIEW: "산책 후기",
    DAILY: "일상",
    CARE_INFO: "케어 정보",
    QUESTION: "질문",
    NOTICE: "공지",
};

export default function CommunityListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [posts, setPosts] = useState([]);
    const [pageInfo, setPageInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [sort, setSort] = useState(searchParams.get("sort") || "latest");
    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const sortedPosts = [...posts].sort((firstPost, secondPost) => {
        if (firstPost.category === "NOTICE" && secondPost.category !== "NOTICE") {
            return -1;
        }
        if (firstPost.category !== "NOTICE" && secondPost.category === "NOTICE") {
            return 1;
        }

        return 0;
    });

    // 커뮤니티 게시글 목록 조회
    const fetchPosts = useCallback(async (params = {}) => {
        try {
            setIsLoading(true);

            const response = await getCommunityPosts({
                page: 0,
                size: 20,
                ...params,
            });

            setPosts(response.data.posts || []);
            setPageInfo(response.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "커뮤니티 게시글 목록 조회에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 현재 검색 조건으로 API 파라미터 생성
    const buildParams = useCallback((next = {}) => {
        const nextCategory = next.category ?? category;
        const nextSort = next.sort ?? sort;
        const nextKeyword = next.keyword ?? keyword;

        const params = {};
        if (nextCategory) params.category = nextCategory;
        if (nextSort) params.sort = nextSort;
        if (nextKeyword.trim()) params.keyword = nextKeyword.trim();

        return params;
    }, [category, keyword, sort]);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const initialParams = {};
        const initialCategory = searchParams.get("category") || "";
        const initialSort = searchParams.get("sort") || "latest";
        const initialKeyword = searchParams.get("keyword") || "";

        if (initialCategory) initialParams.category = initialCategory;
        if (initialSort) initialParams.sort = initialSort;
        if (initialKeyword.trim()) initialParams.keyword = initialKeyword.trim();

        fetchPosts(initialParams);
    }, [fetchPosts, navigate]);

    // 카테고리 변경
    const handleCategoryChange = (nextCategory) => {
        setCategory(nextCategory);

        const nextParams = buildParams({ category: nextCategory });
        setSearchParams(nextParams);
        fetchPosts(nextParams);
    };

    // 정렬 변경
    const handleSortChange = (event) => {
        const nextSort = event.target.value;
        setSort(nextSort);

        const nextParams = buildParams({ sort: nextSort });
        setSearchParams(nextParams);
        fetchPosts(nextParams);
    };

    // 검색 실행
    const handleSearch = (event) => {
        event.preventDefault();

        const nextParams = buildParams();
        setSearchParams(nextParams);
        fetchPosts(nextParams);
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                                COMMUNITY
                            </p>
                            <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                                반려인들과
                                <br />
                                이야기를 나눠보세요
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                산책 후기, 일상, 케어 정보, 궁금한 점을 함께 공유할 수 있습니다.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/community/write")}
                            className="h-12 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:opacity-80"
                        >
                            글쓰기
                        </button>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-8 py-10">
                    <div className="flex flex-col gap-4 border-y border-gray-200 py-4">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => handleCategoryChange(item.value)}
                                    className={`h-10 border px-4 text-sm font-bold transition ${
                                        category === item.value
                                            ? "border-black bg-black text-white"
                                            : "border-gray-200 text-gray-500 hover:border-gray-400"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 flex-1 gap-2">
                                <input
                                    value={keyword}
                                    onChange={(event) => setKeyword(event.target.value)}
                                    className="h-11 min-w-0 flex-1 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                                    placeholder="제목, 내용, 작성자 검색"
                                />

                                <button
                                    type="submit"
                                    className="h-11 bg-black px-6 text-sm font-bold text-white transition hover:opacity-80"
                                >
                                    검색
                                </button>
                            </div>

                            <select
                                value={sort}
                                onChange={handleSortChange}
                                className="h-11 border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </form>

                        <p className="text-sm text-gray-500">
                            총{" "}
                            <span className="font-bold text-gray-950">
                                {pageInfo?.totalElements || posts.length}
                            </span>
                            개의 게시글
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex h-80 items-center justify-center border-b border-gray-100 text-sm text-gray-400">
                            불러오는 중...
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="mt-8 flex h-80 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                            조회된 커뮤니티 게시글이 없습니다.
                        </div>
                    ) : (
                        <div className="mt-6 overflow-hidden border-y border-gray-200">
                            <table className="w-full table-fixed text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="w-28 px-4 py-3 text-left font-bold">카테고리</th>
                                    <th className="px-4 py-3 text-left font-bold">제목</th>
                                    <th className="w-32 px-4 py-3 text-left font-bold">작성자</th>
                                    <th className="w-32 px-4 py-3 text-center font-bold">작성일</th>
                                    <th className="w-20 px-4 py-3 text-center font-bold">조회</th>
                                    <th className="w-20 px-4 py-3 text-center font-bold">추천</th>
                                </tr>
                                </thead>

                                <tbody>
                                {sortedPosts.map((post) => {
                                    const isNotice = post.category === "NOTICE";

                                    return (
                                        <tr
                                            key={post.communityPostId}
                                            onClick={() => navigate(`/community/${post.communityPostId}`)}
                                            className={`cursor-pointer border-b transition ${
                                                isNotice
                                                    ? "border-gray-200 bg-gray-100 hover:bg-gray-200/80"
                                                    : "border-gray-100 hover:bg-gray-50"
                                            }`}
                                        >
                                            <td
                                                className={`px-4 py-4 ${
                                                    isNotice ? "font-bold text-gray-950" : "text-gray-500"
                                                }`}
                                            >
                                                {categoryLabels[post.category] || post.category}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className={`truncate font-bold ${
                                                            isNotice ? "text-gray-950" : "text-gray-950"
                                                        }`}
                                                    >
                                                        {post.title}
                                                    </span>
                                                    {post.commentCount > 0 && (
                                                        <span className="shrink-0 text-xs font-bold text-emerald-600">
                                                            [{post.commentCount}]
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`truncate px-4 py-4 ${
                                                    isNotice ? "font-semibold text-gray-700" : "text-gray-600"
                                                }`}
                                            >
                                                <UserActionTrigger memberId={post.memberId} nickname={post.nickname} />
                                            </td>
                                            <td
                                                className={`px-4 py-4 text-center ${
                                                    isNotice ? "font-semibold text-gray-500" : "text-gray-500"
                                                }`}
                                            >
                                                {formatDateOnly(post.createdAt)}
                                            </td>
                                            <td
                                                className={`px-4 py-4 text-center ${
                                                    isNotice ? "font-semibold text-gray-500" : "text-gray-500"
                                                }`}
                                            >
                                                {post.viewCount}
                                            </td>
                                            <td
                                                className={`px-4 py-4 text-center ${
                                                    isNotice ? "font-semibold text-gray-500" : "text-gray-500"
                                                }`}
                                            >
                                                {post.likeCount}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}
