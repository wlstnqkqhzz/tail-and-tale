// 커뮤니티 게시글 상세 페이지

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import { UserActionTrigger } from "../../components/member/UserMiniProfileModal";
import ReportModal from "../../components/report/ReportModal";
import {
    createCommunityComment,
    deleteCommunityComment,
    deleteCommunityPost,
    getCommunityComments,
    getCommunityPost,
    toggleCommunityPostLike,
    updateCommunityComment,
} from "../../api/community";
import { createReport } from "../../api/report";
import { getAccessToken } from "../../utils/token";

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
    const [replyingCommentId, setReplyingCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [expandedCommentIds, setExpandedCommentIds] = useState(() => new Set());
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);
    const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

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
            setReplyingCommentId(null);
            setReplyContent("");
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

    // 답글 작성 시작
    const handleStartReply = (comment) => {
        setReplyingCommentId(comment.commentId);
        setReplyContent("");
        setEditingCommentId(null);
        setEditingContent("");
        setExpandedCommentIds((prevIds) => {
            const nextIds = new Set(prevIds);
            nextIds.add(comment.commentId);
            return nextIds;
        });
    };

    // 답글 작성
    const handleCreateReply = async (parentCommentId) => {
        if (!replyContent.trim()) {
            alert("답글 내용을 입력해주세요.");
            return;
        }

        try {
            setIsCommentSubmitting(true);

            await createCommunityComment(communityPostId, {
                parentCommentId,
                content: replyContent.trim(),
            });

            setExpandedCommentIds((prevIds) => {
                const nextIds = new Set(prevIds);
                nextIds.add(parentCommentId);
                return nextIds;
            });
            setReplyingCommentId(null);
            setReplyContent("");
            await Promise.all([
                fetchPost(),
                fetchComments(),
            ]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "답글 작성에 실패했습니다.");
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    // 답글 목록 접기/펼치기
    const handleToggleReplies = (commentId) => {
        setExpandedCommentIds((prevIds) => {
            const nextIds = new Set(prevIds);

            if (nextIds.has(commentId)) {
                nextIds.delete(commentId);
            } else {
                nextIds.add(commentId);
            }

            return nextIds;
        });
    };

    // 댓글 수정 시작
    const handleStartEditComment = (comment) => {
        setEditingCommentId(comment.commentId);
        setEditingContent(comment.content);
        setReplyingCommentId(null);
        setReplyContent("");
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

    // 게시글 신고
    const handleReportPost = async ({ reason, content }) => {
        try {
            setIsReportSubmitting(true);

            await createReport({
                targetType: "COMMUNITY_POST",
                targetId: Number(communityPostId),
                reason,
                content,
            });

            alert("신고가 접수되었습니다.");
            setIsReportModalOpen(false);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "신고 접수에 실패했습니다.");
        } finally {
            setIsReportSubmitting(false);
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
                                <UserActionTrigger memberId={post.memberId} nickname={post.nickname} />
                                <span>{formatDateTime(post.createdAt)}</span>
                                <span>조회 {post.viewCount}</span>
                                <span>추천 {post.likeCount}</span>
                                <span>댓글 {post.commentCount}</span>
                            </div>
                        </div>

                        <article className="min-h-80 whitespace-pre-wrap border-b border-gray-200 py-10 text-base leading-8 text-gray-700">
                            {post.linkedWalkReview && (
                                <LinkedWalkReviewCard review={post.linkedWalkReview} />
                            )}

                            {post.images?.length > 0 && (
                                <PostImageGallery images={post.images} title={post.title} />
                            )}

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

                                {!post.isWriter && (
                                    <button
                                        type="button"
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="h-11 border border-red-100 px-5 text-sm font-bold text-red-500 transition hover:bg-red-50"
                                    >
                                        신고
                                    </button>
                                )}

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
                                <span className="text-sm font-bold text-gray-400">{post.commentCount}건</span>
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
                                    {commentTree.map((comment) => (
                                        <CommentRow
                                            key={comment.commentId}
                                            comment={comment}
                                            depth={0}
                                            replyingCommentId={replyingCommentId}
                                            replyContent={replyContent}
                                            expandedCommentIds={expandedCommentIds}
                                            editingCommentId={editingCommentId}
                                            editingContent={editingContent}
                                            isSubmitting={isCommentSubmitting}
                                            onStartReply={handleStartReply}
                                            onChangeReplyContent={setReplyContent}
                                            onCancelReply={() => {
                                                setReplyingCommentId(null);
                                                setReplyContent("");
                                            }}
                                            onSubmitReply={handleCreateReply}
                                            onToggleReplies={handleToggleReplies}
                                            onChangeEditingContent={setEditingContent}
                                            onStartEdit={handleStartEditComment}
                                            onCancelEdit={() => {
                                                setEditingCommentId(null);
                                                setEditingContent("");
                                            }}
                                            onUpdate={handleUpdateComment}
                                            onDelete={handleDeleteComment}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </section>
                )}
            </main>

            <ReportModal
                isOpen={isReportModalOpen}
                targetLabel={post?.title ? `"${post.title}" 게시글` : "게시글"}
                isSubmitting={isReportSubmitting}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportPost}
            />
        </>
    );
}

function LinkedWalkReviewCard({ review }) {
    return (
        <div className="mb-8 border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-[0.3em] text-emerald-600">
                        LINKED WALK REVIEW
                    </p>
                    <h2 className="mt-3 text-xl font-bold text-gray-950">
                        {review.walkTitle}
                    </h2>
                </div>
                <span className="border border-emerald-200 bg-white px-3 py-1 text-sm font-bold text-emerald-600">
                    {renderRating(review.rating)} {review.rating}점
                </span>
            </div>

            <div className="mt-4 grid gap-3 border-t border-emerald-100 pt-4 text-sm text-gray-600 sm:grid-cols-2">
                <InfoItem label="후기 대상" value={review.revieweeNickname} />
                <InfoItem label="작성일" value={formatDateTime(review.createdAt)} />
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {review.content || "후기 내용이 없습니다."}
            </p>
        </div>
    );
}

// 게시글 이미지 갤러리
function PostImageGallery({ images, title }) {
    return (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {images.map((image, index) => (
                <img
                    key={image.postImageId || `${image.imageUrl}-${index}`}
                    src={image.imageUrl}
                    alt={image.originalFileName || `${title} 이미지 ${index + 1}`}
                    className="max-h-[520px] w-full border border-gray-200 object-cover"
                />
            ))}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-1 font-bold text-gray-800">{value || "-"}</p>
        </div>
    );
}

function CommentRow({
    comment,
    depth = 0,
    replyingCommentId,
    replyContent,
    expandedCommentIds,
    editingCommentId,
    editingContent,
    isSubmitting,
    onStartReply,
    onChangeReplyContent,
    onCancelReply,
    onSubmitReply,
    onToggleReplies,
    onChangeEditingContent,
    onStartEdit,
    onCancelEdit,
    onUpdate,
    onDelete,
}) {
    const replyOpen = replyingCommentId === comment.commentId;
    const editing = editingCommentId === comment.commentId;
    const indent = Math.min(depth, 4) * 24;
    const replyCount = countChildComments(comment);
    const hasReplies = comment.children.length > 0;
    const repliesOpen = depth > 0 || expandedCommentIds.has(comment.commentId);
    const showReplyToggle = depth === 0 && hasReplies;

    return (
        <div style={{ marginLeft: indent }}>
            <div className="flex items-start gap-2">
                {depth > 0 && (
                    <span className="mt-5 shrink-0 text-2xl font-bold leading-none text-gray-300" aria-hidden="true">
                        ↳
                    </span>
                )}

                <div className={`min-w-0 flex-1 border border-gray-200 p-5 ${comment.isDeleted ? "bg-gray-50" : "bg-white"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className={`font-bold ${comment.isDeleted ? "text-gray-400" : "text-gray-950"}`}>
                                {comment.isDeleted ? (
                                    comment.nickname
                                ) : (
                                    <UserActionTrigger
                                        memberId={comment.memberId}
                                        nickname={comment.nickname}
                                        profileImageUrl={comment.profileImageUrl}
                                    />
                                )}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">{formatDateTime(comment.createdAt)}</p>
                        </div>

                        {!comment.isDeleted && !editing && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onStartReply(comment)}
                                    className="text-sm font-bold text-gray-500 hover:text-black"
                                >
                                    답글
                                </button>
                                {comment.isWriter && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onStartEdit(comment)}
                                            className="text-sm font-bold text-gray-500 hover:text-black"
                                        >
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(comment.commentId)}
                                            className="text-sm font-bold text-red-500 hover:text-red-600"
                                        >
                                            삭제
                                        </button>
                                    </>
                                )}
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
                                    onClick={() => onUpdate(comment.commentId)}
                                    className="h-9 bg-black px-4 text-sm font-bold text-white transition hover:opacity-80"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={`mt-4 whitespace-pre-wrap text-sm leading-7 ${
                            comment.isDeleted ? "text-gray-400" : "text-gray-700"
                        }`}>
                            {comment.parentNickname && !comment.isDeleted && (
                                <span className="mr-1 font-bold text-gray-400">
                                    {comment.parentNickname}
                                </span>
                            )}
                            {comment.content}
                        </p>
                    )}

                    {replyOpen && (
                        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 text-sm">
                                <span className="font-bold text-gray-700">
                                    {comment.nickname}에게 답글 작성 중
                                </span>
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="text-xs font-bold text-gray-400 transition hover:text-gray-950"
                                >
                                    취소
                                </button>
                            </div>

                            <textarea
                                value={replyContent}
                                onChange={(event) => onChangeReplyContent(event.target.value)}
                                className="min-h-20 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                                placeholder={`${comment.nickname}에게 답글을 입력해주세요.`}
                                maxLength={1000}
                            />

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => onSubmitReply(comment.commentId)}
                                    disabled={isSubmitting}
                                    className="h-9 bg-black px-4 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {isSubmitting ? "등록 중..." : "답글 등록"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showReplyToggle && (
                <div className="ml-8 mt-3">
                    <button
                        type="button"
                        onClick={() => onToggleReplies(comment.commentId)}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-950"
                    >
                        <span
                            className={`h-2 w-2 border-b-2 border-r-2 border-gray-300 transition-transform ${
                                repliesOpen ? "-translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5 rotate-45"
                            }`}
                            aria-hidden="true"
                        />
                        {repliesOpen ? "답글 숨기기" : `답글 ${replyCount}개 보기`}
                    </button>
                </div>
            )}

            {hasReplies && repliesOpen && (
                <div className="mt-3 grid gap-3">
                    {comment.children.map((childComment) => (
                        <CommentRow
                            key={childComment.commentId}
                            comment={childComment}
                            depth={depth + 1}
                            replyingCommentId={replyingCommentId}
                            replyContent={replyContent}
                            expandedCommentIds={expandedCommentIds}
                            editingCommentId={editingCommentId}
                            editingContent={editingContent}
                            isSubmitting={isSubmitting}
                            onStartReply={onStartReply}
                            onChangeReplyContent={onChangeReplyContent}
                            onCancelReply={onCancelReply}
                            onSubmitReply={onSubmitReply}
                            onToggleReplies={onToggleReplies}
                            onChangeEditingContent={onChangeEditingContent}
                            onStartEdit={onStartEdit}
                            onCancelEdit={onCancelEdit}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
function buildCommentTree(comments) {
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach((comment) => {
        commentMap.set(comment.commentId, {
            ...comment,
            children: [],
        });
    });

    commentMap.forEach((comment) => {
        const parentComment = comment.parentCommentId ? commentMap.get(comment.parentCommentId) : null;

        if (parentComment) {
            comment.parentNickname = comment.parentNickname || parentComment.nickname;
            parentComment.children.push(comment);
            return;
        }

        rootComments.push(comment);
    });

    return rootComments;
}

function countChildComments(comment) {
    return comment.children.reduce(
        (totalCount, childComment) => totalCount + 1 + countChildComments(childComment),
        0
    );
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return value.replace("T", " ").slice(0, 16);
}

function renderRating(rating) {
    return "★".repeat(rating || 0);
}
