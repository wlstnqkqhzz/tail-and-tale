// 커뮤니티 게시글 상세 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    createCommunityComment,
    deleteCommunityComment,
    deleteCommunityPost,
    getCommunityComments,
    getCommunityPost,
    toggleCommunityPostLike,
    updateCommunityComment,
} from "../api/community";
import { getAccessToken } from "../utils/token";

const categoryLabels = {
    WALK_REVIEW: "산책 후기",
    DAILY: "일상",
    CARE_INFO: "케어 정보",
    QUESTION: "질문",
    NOTICE: "공지",
};

export default function CommunityDetailPage() {
    const navigate = useNavigate();
    const { communityPostId } = useParams();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

    // 게시글 상세 조회
    const fetchPost = useCallback(async () => {
        const response = await getCommunityPost(communityPostId);
        setPost(response.data);
    }, [communityPostId]);

    // 댓글 목록 조회
    const fetchComments = useCallback(async () => {
        const response = await getCommunityComments(communityPostId);
        setComments(response.data || []);
    }, [communityPostId]);

    // 초기 조회
    useEffect(() => {
        const fetchData = async () => {
            if (!getAccessToken()) {
                alert("로그인이 필요합니다.");
                navigate("/");
                return;
            }

            try {
                setIsLoading(true);

                await Promise.all([
                    fetchPost(),
                    fetchComments(),
                ]);
            } catch (error) {
                console.error(error);
                alert(error.response?.data?.message || "커뮤니티 게시글 조회에 실패했습니다.");
                navigate("/community");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [fetchComments, fetchPost, navigate]);

    // 게시글 삭제
    const handleDeletePost = async () => {
        if (!window.confirm("게시글을 삭제할까요?")) {
            return;
        }

        try {
            setIsDeleting(true);

            await deleteCommunityPost(communityPostId);

            alert("게시글이 삭제되었습니다.");
            navigate("/community");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "게시글 삭제에 실패했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    // 게시글 좋아요
    const handleToggleLike = async () => {
        try {
            const response = await toggleCommunityPostLike(communityPostId);
            setPost(response.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "좋아요 처리에 실패했습니다.");
        }
    };

    // 댓글 작성
    const handleCreateComment = async (event) => {
        event.preventDefault();

        if (!commentContent.trim()) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        try {
            setIsCommentSubmitting(true);

            await createCommunityComment(communityPostId, {
                content: commentContent.trim(),
            });

            setCommentContent("");
            await Promise.all([
                fetchPost(),
                fetchComments(),
            ]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "댓글 작성에 실패했습니다.");
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    // 댓글 수정 시작
    const handleStartEditComment = (comment) => {
        setEditingCommentId(comment.commentId);
        setEditingContent(comment.content);
    };

    // 댓글 수정
    const handleUpdateComment = async (commentId) => {
        if (!editingContent.trim()) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        try {
            await updateCommunityComment(communityPostId, commentId, {
                content: editingContent.trim(),
            });

            setEditingCommentId(null);
            setEditingContent("");
            await fetchComments();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "댓글 수정에 실패했습니다.");
        }
    };

    // 댓글 삭제
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제할까요?")) {
            return;
        }

        try {
            await deleteCommunityComment(communityPostId, commentId);

            await Promise.all([
                fetchPost(),
                fetchComments(),
            ]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "댓글 삭제에 실패했습니다.");
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
                    <section className="mx-auto max-w-5xl px-8 py-14">
                        <div className="border-b border-gray-200 pb-8">
                            <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                                COMMUNITY
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <span className="border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
                                    {categoryLabels[post.category] || post.category}
                                </span>
                                {post.dogName && (
                                    <span className="border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                        {post.dogName}
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-5 text-4xl font-bold leading-tight text-gray-950">
                                {post.title}
                            </h1>

                            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span>{post.nickname}</span>
                                <span>{formatDateTime(post.createdAt)}</span>
                                <span>조회 {post.viewCount}</span>
                                <span>추천 {post.likeCount}</span>
                                <span>댓글 {post.commentCount}</span>
                            </div>
                        </div>

                        <article className="min-h-80 whitespace-pre-wrap border-b border-gray-200 py-10 text-base leading-8 text-gray-700">
                            {post.content}
                        </article>

                        <div className="mt-8 flex flex-wrap justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/community")}
                                className="h-11 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                            >
                                목록
                            </button>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleToggleLike}
                                    className={`h-11 border px-5 text-sm font-bold transition ${
                                        post.isLiked
                                            ? "border-black bg-black text-white"
                                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    좋아요 {post.likeCount}
                                </button>

                                {post.isWriter && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/community/${communityPostId}/edit`)}
                                            className="h-11 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                                        >
                                            수정
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDeletePost}
                                            disabled={isDeleting}
                                            className="h-11 border border-red-100 px-5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isDeleting ? "삭제 중..." : "삭제"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <section className="mt-12 border-t border-gray-200 pt-8">
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-950">댓글</h2>
                                <span className="text-sm font-bold text-gray-400">{comments.length}건</span>
                            </div>

                            <form onSubmit={handleCreateComment} className="mb-8 grid gap-3">
                                <textarea
                                    value={commentContent}
                                    onChange={(event) => setCommentContent(event.target.value)}
                                    className="min-h-24 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                                    placeholder="댓글을 입력해주세요."
                                    maxLength={1000}
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isCommentSubmitting}
                                        className="h-10 bg-black px-5 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {isCommentSubmitting ? "등록 중..." : "댓글 등록"}
                                    </button>
                                </div>
                            </form>

                            {comments.length === 0 ? (
                                <div className="flex h-32 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                                    아직 작성된 댓글이 없습니다.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {comments.map((comment) => (
                                        <CommentRow
                                            key={comment.commentId}
                                            comment={comment}
                                            editing={editingCommentId === comment.commentId}
                                            editingContent={editingContent}
                                            onChangeEditingContent={setEditingContent}
                                            onStartEdit={() => handleStartEditComment(comment)}
                                            onCancelEdit={() => {
                                                setEditingCommentId(null);
                                                setEditingContent("");
                                            }}
                                            onUpdate={() => handleUpdateComment(comment.commentId)}
                                            onDelete={() => handleDeleteComment(comment.commentId)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </section>
                )}
            </main>
        </>
    );
}

function CommentRow({
    comment,
    editing,
    editingContent,
    onChangeEditingContent,
    onStartEdit,
    onCancelEdit,
    onUpdate,
    onDelete,
}) {
    return (
        <div className="border border-gray-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-gray-950">{comment.nickname}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(comment.createdAt)}</p>
                </div>

                {comment.isWriter && !editing && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onStartEdit}
                            className="text-sm font-bold text-gray-500 hover:text-black"
                        >
                            수정
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="text-sm font-bold text-red-500 hover:text-red-600"
                        >
                            삭제
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="mt-4 grid gap-3">
                    <textarea
                        value={editingContent}
                        onChange={(event) => onChangeEditingContent(event.target.value)}
                        className="min-h-24 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                        maxLength={1000}
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="h-9 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={onUpdate}
                            className="h-9 bg-black px-4 text-sm font-bold text-white transition hover:opacity-80"
                        >
                            저장
                        </button>
                    </div>
                </div>
            ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {comment.content}
                </p>
            )}
        </div>
    );
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return value.replace("T", " ").slice(0, 16);
}
