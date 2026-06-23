// 관리자 대시보드 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    deleteAdminCommunityComment,
    deleteAdminCommunityPost,
    getAdminCommunityComments,
    getAdminCommunityPosts,
    getAdminDashboard,
    getAdminMembers,
    getAdminReports,
    updateAdminMemberStatus,
    updateAdminReport,
} from "../api/admin";
import { useAuth } from "../hooks/useAuth";

const tabs = [
    { key: "members", label: "회원 관리" },
    { key: "posts", label: "게시글 관리" },
    { key: "comments", label: "댓글 관리" },
    { key: "reports", label: "신고 관리" },
];

const statusLabels = {
    PENDING: "추가 정보 대기",
    ACTIVE: "활성",
    INACTIVE: "휴면",
    BANNED: "정지",
    DELETED: "탈퇴",
};

const changeableStatusLabels = {
    PENDING: "추가 정보 대기",
    ACTIVE: "활성",
    INACTIVE: "휴면",
    BANNED: "정지",
};

const categoryLabels = {
    DAILY: "일상",
    WALK_REVIEW: "산책 후기",
    CARE_INFO: "케어 정보",
    QUESTION: "질문",
    NOTICE: "공지",
};

const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "views", label: "조회순" },
    { value: "likes", label: "추천순" },
];

const reportStatusLabels = {
    PENDING: "접수",
    REVIEWED: "검토 중",
    REJECTED: "반려",
    RESOLVED: "처리 완료",
};

const reportTargetTypeLabels = {
    MEMBER: "회원",
    COMMUNITY_POST: "게시글",
    COMMUNITY_COMMENT: "댓글",
    CHAT_ROOM: "채팅방",
    CHAT_MESSAGE: "채팅 메시지",
};

const reportReasonLabels = {
    MONEY_TRADE: "금전 거래",
    STALKING: "스토킹",
    SEXUAL_CONTENT: "음란물",
    BAD_MANNER: "비매너",
    ETC: "기타",
};

export default function AdminPage() {
    const navigate = useNavigate();
    const { isLoading: isAuthLoading, isLoggedIn, member } = useAuth();

    const [activeTab, setActiveTab] = useState("members");
    const [dashboard, setDashboard] = useState(null);
    const [members, setMembers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [memberKeyword, setMemberKeyword] = useState("");
    const [memberSearchKeyword, setMemberSearchKeyword] = useState("");
    const [memberStatus, setMemberStatus] = useState("");

    const [postKeyword, setPostKeyword] = useState("");
    const [postSearchKeyword, setPostSearchKeyword] = useState("");
    const [postCategory, setPostCategory] = useState("");
    const [postSort, setPostSort] = useState("latest");

    const [commentKeyword, setCommentKeyword] = useState("");
    const [commentSearchKeyword, setCommentSearchKeyword] = useState("");

    const [reportKeyword, setReportKeyword] = useState("");
    const [reportSearchKeyword, setReportSearchKeyword] = useState("");
    const [reportStatus, setReportStatus] = useState("PENDING");
    const [reportTargetType, setReportTargetType] = useState("");

    const fetchDashboard = useCallback(async () => {
        const response = await getAdminDashboard();
        setDashboard(response.data);
    }, []);

    const fetchMembers = useCallback(async () => {
        const response = await getAdminMembers({
            page: 0,
            size: 50,
            status: memberStatus || undefined,
            keyword: memberSearchKeyword.trim() || undefined,
        });

        setMembers(response.data.members || []);
    }, [memberSearchKeyword, memberStatus]);

    const fetchPosts = useCallback(async () => {
        const response = await getAdminCommunityPosts({
            page: 0,
            size: 50,
            category: postCategory || undefined,
            keyword: postSearchKeyword.trim() || undefined,
            sort: postSort,
        });

        setPosts(response.data.posts || []);
    }, [postCategory, postSearchKeyword, postSort]);

    const fetchComments = useCallback(async () => {
        const response = await getAdminCommunityComments({
            page: 0,
            size: 50,
            keyword: commentSearchKeyword.trim() || undefined,
        });

        setComments(response.data.comments || []);
    }, [commentSearchKeyword]);

    const fetchReports = useCallback(async () => {
        const response = await getAdminReports({
            page: 0,
            size: 50,
            status: reportStatus || undefined,
            targetType: reportTargetType || undefined,
            keyword: reportSearchKeyword.trim() || undefined,
        });

        setReports(response.data.reports || []);
    }, [reportSearchKeyword, reportStatus, reportTargetType]);

    const fetchActiveTab = useCallback(async () => {
        if (activeTab === "members") {
            await fetchMembers();
            return;
        }

        if (activeTab === "posts") {
            await fetchPosts();
            return;
        }

        if (activeTab === "comments") {
            await fetchComments();
            return;
        }

        await fetchReports();
    }, [activeTab, fetchComments, fetchMembers, fetchPosts, fetchReports]);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!isLoggedIn) {
            navigate("/");
            return;
        }

        if (member?.role !== "ADMIN") {
            setIsLoading(false);
            return;
        }

        const fetchAdminData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    fetchDashboard(),
                    fetchActiveTab(),
                ]);
            } catch (error) {
                console.error(error);
                alert(error.response?.data?.message || "관리자 정보를 불러오지 못했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminData();
    }, [fetchActiveTab, fetchDashboard, isAuthLoading, isLoggedIn, member?.role, navigate]);

    const handleMemberStatusChange = async (targetMemberId, nextStatus) => {
        if (!window.confirm("회원 상태를 변경할까요?")) {
            return;
        }

        try {
            await updateAdminMemberStatus(targetMemberId, { status: nextStatus });
            await Promise.all([fetchDashboard(), fetchMembers()]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "회원 상태 변경에 실패했습니다.");
        }
    };

    const handleDeletePost = async (communityPostId) => {
        if (!window.confirm("게시글을 삭제할까요? 연결된 댓글도 함께 삭제됩니다.")) {
            return;
        }

        try {
            await deleteAdminCommunityPost(communityPostId);
            await Promise.all([fetchDashboard(), fetchPosts()]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "게시글 삭제에 실패했습니다.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제할까요?")) {
            return;
        }

        try {
            await deleteAdminCommunityComment(commentId);
            await Promise.all([fetchDashboard(), fetchComments()]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "댓글 삭제에 실패했습니다.");
        }
    };

    const handleReportStatusChange = async (reportId, nextStatus, action = "REVIEW_ONLY") => {
        const confirmMessages = {
            REVIEW_ONLY: "신고를 검토 중 상태로 변경하시겠습니까?",
            REJECT_REPORT: "신고를 반려하시겠습니까?",
            DELETE_TARGET: "신고 대상을 삭제하고 신고를 처리 완료하시겠습니까?",
            BAN_REPORTED_MEMBER: "신고 대상 회원을 정지하고 신고를 처리 완료하시겠습니까?",
        };

        const confirmMessage = confirmMessages[action] || "신고 처리 상태를 변경하시겠습니까?";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await updateAdminReport(reportId, {
                status: nextStatus,
                action,
                adminMemo: null,
            });

            await Promise.all([fetchDashboard(), fetchReports()]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "신고 처리 상태 변경에 실패했습니다.");
        }
    };

    const handleMemberSearch = () => {
        setMemberSearchKeyword(memberKeyword);
    };

    const handlePostSearch = () => {
        setPostSearchKeyword(postKeyword);
    };

    const handleCommentSearch = () => {
        setCommentSearchKeyword(commentKeyword);
    };

    const handleReportSearch = () => {
        setReportSearchKeyword(reportKeyword);
    };

    if (isAuthLoading || isLoading) {
        return (
            <>
                <Header />
                <main className="pt-20">
                    <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-8 text-sm text-gray-400">
                        관리자 정보를 확인하는 중...
                    </div>
                </main>
            </>
        );
    }

    if (member?.role !== "ADMIN") {
        return (
            <>
                <Header />
                <main className="pt-20">
                    <section className="mx-auto max-w-7xl px-8 py-24">
                        <p className="text-sm font-bold tracking-[0.35em] text-emerald-700">ADMIN</p>
                        <h1 className="mt-6 text-5xl font-bold leading-tight text-gray-950">
                            관리자만 접근할 수 있습니다.
                        </h1>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="mt-10 h-12 rounded-full bg-black px-8 text-sm font-bold text-white"
                        >
                            홈으로 돌아가기
                        </button>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="pt-20">
                <section className="border-b border-gray-100">
                    <div className="mx-auto max-w-7xl px-8 py-16">
                        <p className="text-sm font-bold tracking-[0.35em] text-emerald-700">ADMIN</p>
                        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-5xl font-bold leading-tight text-gray-950">
                                    Tail & Tale 운영 현황을<br />
                                    한 곳에서 관리하세요
                                </h1>
                                <p className="mt-5 text-sm leading-7 text-gray-500">
                                    회원 상태, 커뮤니티 게시글, 댓글, 신고 내역을 확인하고 필요한 조치를 진행할 수 있습니다.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[744px] lg:grid-cols-6">
                                <StatBox label="전체 회원" value={dashboard?.totalMemberCount ?? 0} />
                                <StatBox label="활성 회원" value={dashboard?.activeMemberCount ?? 0} />
                                <StatBox label="정지 회원" value={dashboard?.bannedMemberCount ?? 0} />
                                <StatBox label="게시글" value={dashboard?.communityPostCount ?? 0} />
                                <StatBox label="댓글" value={dashboard?.communityCommentCount ?? 0} />
                                <StatBox label="대기 신고" value={dashboard?.pendingReportCount ?? 0} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-8 py-10">
                    <div className="flex border-b border-gray-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`h-14 px-8 text-sm font-bold transition ${
                                    activeTab === tab.key
                                        ? "border-b-2 border-black text-gray-950"
                                        : "text-gray-400 hover:text-gray-950"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "members" && (
                        <MemberAdminSection
                            members={members}
                            keyword={memberKeyword}
                            status={memberStatus}
                            currentMemberId={member.memberId}
                            onKeywordChange={setMemberKeyword}
                            onStatusChange={setMemberStatus}
                            onSearch={handleMemberSearch}
                            onMemberStatusChange={handleMemberStatusChange}
                        />
                    )}

                    {activeTab === "posts" && (
                        <PostAdminSection
                            posts={posts}
                            keyword={postKeyword}
                            category={postCategory}
                            sort={postSort}
                            onKeywordChange={setPostKeyword}
                            onCategoryChange={setPostCategory}
                            onSortChange={setPostSort}
                            onSearch={handlePostSearch}
                            onDelete={handleDeletePost}
                            onMoveDetail={(postId) => navigate(`/community/${postId}`)}
                        />
                    )}

                    {activeTab === "comments" && (
                        <CommentAdminSection
                            comments={comments}
                            keyword={commentKeyword}
                            onKeywordChange={setCommentKeyword}
                            onSearch={handleCommentSearch}
                            onDelete={handleDeleteComment}
                            onMovePost={(postId) => navigate(`/community/${postId}`)}
                        />
                    )}

                    {activeTab === "reports" && (
                        <ReportAdminSection
                            reports={reports}
                            keyword={reportKeyword}
                            status={reportStatus}
                            targetType={reportTargetType}
                            onKeywordChange={setReportKeyword}
                            onSearch={handleReportSearch}
                            onStatusChange={setReportStatus}
                            onTargetTypeChange={setReportTargetType}
                            onStatusUpdate={handleReportStatusChange}
                        />
                    )}
                </section>
            </main>
        </>
    );
}

function StatBox({ label, value }) {
    return (
        <div className="border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-4 text-3xl font-bold text-gray-950">{value}</p>
        </div>
    );
}

function MemberAdminSection({
                                members,
                                keyword,
                                status,
                                currentMemberId,
                                onKeywordChange,
                                onStatusChange,
                                onSearch,
                                onMemberStatusChange,
                            }) {
    return (
        <div className="py-8">
            <AdminFilter>
                <input
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSearch();
                        }
                    }}
                    className="input"
                    placeholder="이메일, 닉네임, 실명 검색"
                />
                <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="input">
                    <option value="">상태 전체</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <button type="button" onClick={onSearch} className="h-12 bg-black px-8 text-sm font-bold text-white">
                    검색
                </button>
            </AdminFilter>

            <div className="mt-8 overflow-x-auto border border-gray-200">
                <table className="w-full min-w-[1040px] text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-400">
                    <tr>
                        <th className="px-5 py-4">회원</th>
                        <th className="px-5 py-4">실명</th>
                        <th className="px-5 py-4">연락처</th>
                        <th className="px-5 py-4">지역</th>
                        <th className="px-5 py-4">권한</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4">가입일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((item) => (
                        <tr key={item.memberId} className="border-b border-gray-100">
                            <td className="px-5 py-4">
                                <p className="font-bold text-gray-950">{item.nickname}</p>
                                <p className="mt-1 text-xs text-gray-400">{item.email}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{item.realName || "-"}</td>
                            <td className="px-5 py-4 text-gray-600">{item.phoneNumber || "-"}</td>
                            <td className="px-5 py-4 text-gray-600">{item.region || "-"}</td>
                            <td className="px-5 py-4 text-gray-600">{item.role}</td>
                            <td className="px-5 py-4">
                                <select
                                    value={item.status}
                                    disabled={item.memberId === currentMemberId || item.status === "DELETED"}
                                    onChange={(event) => onMemberStatusChange(item.memberId, event.target.value)}
                                    className="h-10 border border-gray-200 px-3 text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    {item.status === "DELETED" ? (
                                        <option value="DELETED">탈퇴</option>
                                    ) : (
                                        Object.entries(changeableStatusLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))
                                    )}
                                </select>
                            </td>
                            <td className="px-5 py-4 text-gray-400">{formatDateTime(item.createdAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PostAdminSection({
                              posts,
                              keyword,
                              category,
                              sort,
                              onKeywordChange,
                              onCategoryChange,
                              onSortChange,
                              onSearch,
                              onDelete,
                              onMoveDetail,
                          }) {
    return (
        <div className="py-8">
            <AdminFilter>
                <input
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSearch();
                        }
                    }}
                    className="input"
                    placeholder="제목, 내용, 작성자 검색"
                />
                <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className="input">
                    <option value="">카테고리 전체</option>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select value={sort} onChange={(event) => onSortChange(event.target.value)} className="input">
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <button type="button" onClick={onSearch} className="h-12 bg-black px-8 text-sm font-bold text-white">
                    검색
                </button>
            </AdminFilter>

            <div className="mt-8 grid gap-3">
                {posts.map((post) => (
                    <AdminListRow key={post.communityPostId}>
                        <button type="button" onClick={() => onMoveDetail(post.communityPostId)} className="min-w-0 text-left">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
                                <span>{categoryLabels[post.category] || post.category}</span>
                                <span>댓글 {post.commentCount}</span>
                                <span>좋아요 {post.likeCount}</span>
                                <span>조회 {post.viewCount}</span>
                            </div>
                            <h3 className="mt-2 truncate text-lg font-bold text-gray-950">{post.title}</h3>
                            <p className="mt-2 text-sm text-gray-500">{post.nickname} · {formatDateTime(post.createdAt)}</p>
                        </button>
                        <button type="button" onClick={() => onDelete(post.communityPostId)} className="h-10 border border-red-100 px-5 text-sm font-bold text-red-500">
                            삭제
                        </button>
                    </AdminListRow>
                ))}
                {posts.length === 0 && <EmptyBox text="관리할 게시글이 없습니다." />}
            </div>
        </div>
    );
}

function CommentAdminSection({ comments, keyword, onKeywordChange, onSearch, onDelete, onMovePost }) {
    return (
        <div className="py-8">
            <AdminFilter>
                <input
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSearch();
                        }
                    }}
                    className="input"
                    placeholder="댓글, 게시글 제목, 작성자 검색"
                />
                <button type="button" onClick={onSearch} className="h-12 bg-black px-8 text-sm font-bold text-white">
                    검색
                </button>
            </AdminFilter>

            <div className="mt-8 grid gap-3">
                {comments.map((comment) => (
                    <AdminListRow key={comment.commentId}>
                        <button type="button" onClick={() => onMovePost(comment.communityPostId)} className="min-w-0 text-left">
                            <p className="text-xs font-bold text-gray-400">{comment.communityPostTitle}</p>
                            <h3 className="mt-2 line-clamp-2 text-base font-bold text-gray-950">{comment.content}</h3>
                            <p className="mt-2 text-sm text-gray-500">{comment.nickname} · {formatDateTime(comment.createdAt)}</p>
                        </button>
                        <button type="button" onClick={() => onDelete(comment.commentId)} className="h-10 border border-red-100 px-5 text-sm font-bold text-red-500">
                            삭제
                        </button>
                    </AdminListRow>
                ))}
                {comments.length === 0 && <EmptyBox text="관리할 댓글이 없습니다." />}
            </div>
        </div>
    );
}

function ReportAdminSection({
                                reports,
                                keyword,
                                status,
                                targetType,
                                onKeywordChange,
                                onSearch,
                                onStatusChange,
                                onTargetTypeChange,
                                onStatusUpdate,
                            }) {
    const deletableTargetTypes = ["COMMUNITY_POST", "COMMUNITY_COMMENT", "CHAT_MESSAGE"];

    const reportStatusStyles = {
        PENDING: "border-amber-100 bg-amber-50 text-amber-700",
        REVIEWED: "border-sky-100 bg-sky-50 text-sky-700",
        REJECTED: "border-gray-200 bg-gray-50 text-gray-500",
        RESOLVED: "border-emerald-100 bg-emerald-50 text-emerald-700",
    };

    return (
        <div className="py-8">
            <AdminFilter>
                <input
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSearch();
                        }
                    }}
                    className="input"
                    placeholder="신고자, 대상자, 신고 내용 검색"
                />

                <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="input">
                    {Object.entries(reportStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <select value={targetType} onChange={(event) => onTargetTypeChange(event.target.value)} className="input">
                    <option value="">대상 전체</option>
                    {Object.entries(reportTargetTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <button type="button" onClick={onSearch} className="h-12 bg-black px-8 text-sm font-bold text-white">
                    검색
                </button>
            </AdminFilter>

            <div className="mt-8 grid gap-3">
                {reports.map((report) => (
                    <AdminListRow key={report.reportId}>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
                                    {reportTargetTypeLabels[report.targetType] || report.targetType}
                                </span>
                                <span className="border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                                    {reportReasonLabels[report.reason] || report.reason}
                                </span>
                                <span
                                    className={`border px-3 py-1 text-xs font-bold ${
                                        reportStatusStyles[report.status] || "border-gray-200 bg-gray-50 text-gray-500"
                                    }`}
                                >
                                    {reportStatusLabels[report.status] || report.status}
                                </span>
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-gray-950">
                                {report.reportedNickname || "대상 없음"} 신고
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                신고자 {report.reporterNickname} · 대상 ID {report.targetId} · {formatDateTime(report.createdAt)}
                            </p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                {report.content || "상세 내용이 없습니다."}
                            </p>

                            {report.adminMemo && (
                                <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-500">
                                    관리자 메모: {report.adminMemo}
                                </p>
                            )}
                        </div>

                        <div className="flex min-w-36 flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => onStatusUpdate(report.reportId, "REVIEWED", "REVIEW_ONLY")}
                                className="h-9 border border-sky-100 bg-sky-50 px-3 text-sm font-bold text-sky-700 hover:bg-sky-100"
                            >
                                검토 중
                            </button>

                            <button
                                type="button"
                                onClick={() => onStatusUpdate(report.reportId, "REJECTED", "REJECT_REPORT")}
                                className="h-9 border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
                            >
                                신고 반려
                            </button>

                            {deletableTargetTypes.includes(report.targetType) && (
                                <button
                                    type="button"
                                    onClick={() => onStatusUpdate(report.reportId, "RESOLVED", "DELETE_TARGET")}
                                    className="h-9 border border-rose-100 bg-rose-50 px-3 text-sm font-bold text-rose-600 hover:bg-rose-100"
                                >
                                    대상 삭제
                                </button>
                            )}

                            {report.reportedMemberId && (
                                <button
                                    type="button"
                                    onClick={() => onStatusUpdate(report.reportId, "RESOLVED", "BAN_REPORTED_MEMBER")}
                                    className="h-9 border border-red-200 bg-white px-3 text-sm font-bold text-red-600 hover:bg-red-50"
                                >
                                    회원 정지
                                </button>
                            )}
                        </div>
                    </AdminListRow>
                ))}

                {reports.length === 0 && <EmptyBox text="접수된 신고가 없습니다." />}
            </div>
        </div>
    );
}

function AdminFilter({ children }) {
    return (
        <div className="grid gap-3 border-b border-gray-200 pb-8 md:grid-cols-[1fr_180px_160px_auto]">
            {children}
        </div>
    );
}

function AdminListRow({ children }) {
    return (
        <div className="grid gap-4 border border-gray-200 p-5 md:grid-cols-[1fr_auto] md:items-start">
            {children}
        </div>
    );
}

function EmptyBox({ text }) {
    return (
        <div className="flex h-40 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
            {text}
        </div>
    );
}

function formatDateTime(dateTime) {
    if (!dateTime) {
        return "-";
    }

    return dateTime.replace("T", " ").slice(0, 16);
}