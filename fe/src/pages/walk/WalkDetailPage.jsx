// 산책 게시글 상세 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import { UserActionTrigger } from "../../components/member/UserMiniProfileModal";
import { InfoBadge, StatusBadge } from "../../components/walk/WalkBadges";
import { getWalkChatRoom } from "../../api/chat";
import { getDogs } from "../../api/dog";
import {
    approveWalkParticipant,
    cancelMyWalkParticipation,
    closeWalkSchedule,
    createWalkReview,
    getWalkParticipants,
    getWalkReviews,
    getWalkSchedule,
    rejectWalkParticipant,
    reopenWalkSchedule,
    requestWalkParticipation,
} from "../../api/walk";
import { useAuth } from "../../hooks/useAuth";
import { getAccessToken } from "../../utils/token";
import { formatAverageRating, formatDateTime, formatDogSize, formatParticipantStatus } from "../../utils/walkFormat";

import { initialApplyForm, initialReviewForm } from "../../constants/walkDetail";
import { ApplyWalkModal, DetailItem, HostParticipantPanel, WalkReviewPanel } from "../../components/walk/WalkDetailSections";
import { canApply, getApplyButtonText, getReviewTargetOptions } from "../../utils/walkDetail";

export default function WalkDetailPage() {
    const navigate = useNavigate();
    const { walkScheduleId } = useParams();
    const { member } = useAuth();

    // 산책 상세 상태
    const [schedule, setSchedule] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [dogs, setDogs] = useState([]);

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const [isRecruitmentChanging, setIsRecruitmentChanging] = useState(false);
    const [applyForm, setApplyForm] = useState(initialApplyForm);
    const [reviewForm, setReviewForm] = useState(initialReviewForm);

    const isHost = Boolean(member && schedule?.hostMemberId === member.memberId);
    const canEnterChat = Boolean(schedule && (isHost || schedule.myParticipantStatus === "APPROVED"));
    const verifiedDogs = dogs.filter((dog) => dog.isVerified);
    const canCancelParticipation = Boolean(schedule && ["REQUESTED", "APPROVED"].includes(schedule.myParticipantStatus));
    const approvedParticipants = participants.filter((participant) => participant.status === "APPROVED");
    const [nowTime] = useState(() => Date.now());
    const canWriteReview = Boolean(
        schedule
        && member
        && schedule.status !== "CANCELED"
        && new Date(schedule.scheduledAt).getTime() <= nowTime
        && (isHost || schedule.myParticipantStatus === "APPROVED")
    );
    const reviewTargetOptions = getReviewTargetOptions(schedule, member, approvedParticipants);

    // 산책 게시글 상세 조회
    const fetchScheduleDetail = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getWalkSchedule(walkScheduleId);

            setSchedule(response.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 게시글 상세 조회에 실패했습니다.");
            navigate("/walks");
        } finally {
            setIsLoading(false);
        }
    }, [navigate, walkScheduleId]);

    // 호스트 신청자 목록 조회
    const fetchParticipants = useCallback(async () => {
        try {
            setIsParticipantsLoading(true);

            const response = await getWalkParticipants(walkScheduleId);

            setParticipants(response.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "신청자 목록 조회에 실패했습니다.");
        } finally {
            setIsParticipantsLoading(false);
        }
    }, [walkScheduleId]);

    // 산책 후기 목록 조회
    const fetchReviews = useCallback(async () => {
        try {
            const response = await getWalkReviews(walkScheduleId);

            setReviews(response.data);
        } catch (error) {
            console.error(error);
            setReviews([]);
        }
    }, [walkScheduleId]);

    // 내 반려견 목록 조회
    const fetchDogs = useCallback(async () => {
        try {
            const response = await getDogs();

            setDogs(response.data);
        } catch (error) {
            console.error(error);
            setDogs([]);
        }
    }, []);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            fetchScheduleDetail();
            fetchParticipants();
            fetchReviews();
            fetchDogs();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchDogs, fetchParticipants, fetchReviews, fetchScheduleDetail, navigate]);

    // 후기 대상 기본값 설정
    useEffect(() => {
        if (reviewForm.revieweeId || reviewTargetOptions.length === 0) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setReviewForm((prevForm) => ({
                ...prevForm,
                revieweeId: String(reviewTargetOptions[0].memberId),
            }));
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [reviewForm.revieweeId, reviewTargetOptions]);

    // 신청 모달 열기
    const openApplyModal = () => {
        if (!schedule) {
            return;
        }

        if (dogs.length === 0) {
            alert("산책 신청을 위해 먼저 반려견을 등록해주세요.");
            navigate("/dogs");
            return;
        }

        if (verifiedDogs.length === 0) {
            alert("산책 참여를 위해 먼저 반려견 인증을 진행해주세요.");
            navigate("/dogs");
            return;
        }

        setApplyForm({
            dogId: String(verifiedDogs[0].dogId),
            message: "",
        });
        setIsApplyModalOpen(true);
    };

    // 신청 폼 변경
    const handleApplyChange = (event) => {
        const { name, value } = event.target;

        setApplyForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 후기 폼 변경
    const handleReviewChange = (event) => {
        const { name, value } = event.target;

        setReviewForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 산책 참여 신청
    const handleApply = async (event) => {
        event.preventDefault();

        if (!applyForm.dogId) {
            alert("참여할 반려견을 선택해주세요.");
            return;
        }

        const selectedDog = dogs.find((dog) => String(dog.dogId) === applyForm.dogId);

        if (!selectedDog?.isVerified) {
            alert("산책 참여를 위해 먼저 반려견 인증을 진행해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await requestWalkParticipation(walkScheduleId, {
                dogId: Number(applyForm.dogId),
                message: applyForm.message.trim(),
            });

            alert("산책 참여 신청이 완료되었습니다.");
            setIsApplyModalOpen(false);
            setApplyForm(initialApplyForm);
            await fetchScheduleDetail();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 참여 신청에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 산책 후기 작성
    const handleCreateReview = async (event) => {
        event.preventDefault();

        if (!reviewForm.revieweeId) {
            alert("후기를 남길 대상을 선택해주세요.");
            return;
        }

        try {
            setIsReviewSubmitting(true);

            await createWalkReview(walkScheduleId, {
                revieweeId: Number(reviewForm.revieweeId),
                rating: Number(reviewForm.rating),
                content: reviewForm.content.trim(),
            });

            alert("산책 후기가 등록되었습니다.");
            setReviewForm({
                ...initialReviewForm,
                revieweeId: reviewTargetOptions[0] ? String(reviewTargetOptions[0].memberId) : "",
            });
            await fetchReviews();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 후기 등록에 실패했습니다.");
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    // 산책 참여 승인
    const handleApprove = async (walkParticipantId) => {
        try {
            await approveWalkParticipant(walkScheduleId, walkParticipantId);

            alert("참여 신청을 승인했습니다.");
            await fetchScheduleDetail();
            await fetchParticipants();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "참여 신청 승인에 실패했습니다.");
        }
    };

    // 산책 참여 거절
    const handleReject = async (walkParticipantId) => {
        try {
            await rejectWalkParticipant(walkScheduleId, walkParticipantId);

            alert("참여 신청을 거절했습니다.");
            await fetchScheduleDetail();
            await fetchParticipants();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "참여 신청 거절에 실패했습니다.");
        }
    };

    // 내 산책 참여 취소
    const handleCancelMyParticipation = async () => {
        if (!window.confirm("산책 참여 신청을 취소할까요?")) {
            return;
        }

        try {
            await cancelMyWalkParticipation(walkScheduleId);

            alert("산책 참여 신청이 취소되었습니다.");
            await fetchScheduleDetail();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 참여 신청 취소에 실패했습니다.");
        }
    };

    // 산책 모집 마감
    const handleCloseRecruitment = async () => {
        if (!window.confirm("산책 모집을 마감할까요?")) {
            return;
        }

        try {
            setIsRecruitmentChanging(true);

            const response = await closeWalkSchedule(walkScheduleId);

            setSchedule(response.data);
            alert("산책 모집을 마감했습니다.");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 모집 마감에 실패했습니다.");
        } finally {
            setIsRecruitmentChanging(false);
        }
    };

    // 산책 모집 재개
    const handleReopenRecruitment = async () => {
        if (!window.confirm("산책 모집을 다시 시작할까요?")) {
            return;
        }

        try {
            setIsRecruitmentChanging(true);

            const response = await reopenWalkSchedule(walkScheduleId);

            setSchedule(response.data);
            alert("산책 모집을 재개했습니다.");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 모집 재개에 실패했습니다.");
        } finally {
            setIsRecruitmentChanging(false);
        }
    };

    // 채팅방 입장
    const enterChatRoom = async () => {
        if (!schedule) {
            return;
        }

        try {
            const response = await getWalkChatRoom(walkScheduleId);

            navigate(`/chat/rooms/${response.data.chatRoomId}`, {
                state: {
                    walkTitle: response.data.walkTitle,
                    walkScheduleId: response.data.walkScheduleId,
                },
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "채팅방 입장에 실패했습니다.");
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        상세 정보를 불러오는 중...
                    </div>
                ) : schedule && (
                    <>
                        <section className="border-b border-gray-100 px-8 py-14">
                            <div className="mx-auto max-w-6xl">
                                <button
                                    type="button"
                                    onClick={() => navigate("/walks")}
                                    className="mb-8 text-sm font-bold text-gray-500 transition hover:text-gray-950"
                                >
                                    목록으로 돌아가기
                                </button>

                                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <div className="mb-4 flex flex-wrap items-center gap-2">
                                            <StatusBadge status={schedule.status} />
                                            {schedule.isRecruitable && <InfoBadge label="모집 가능" tone="green" />}
                                            {isHost && <InfoBadge label="내가 만든 일정" tone="blue" />}
                                        </div>

                                        <h1 className="max-w-4xl text-5xl font-bold leading-tight text-gray-950">
                                            {schedule.title}
                                        </h1>
                                        <p className="mt-5 max-w-3xl text-base leading-7 text-gray-500">
                                            {schedule.description || "등록된 설명이 없습니다."}
                                        </p>
                                        {schedule.reviewCount > 0 && (
                                            <p className="mt-4 text-base font-bold text-amber-500">
                                                {formatAverageRating(schedule.averageRating)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-72">
                                        <button
                                            type="button"
                                            onClick={openApplyModal}
                                            disabled={!canApply(schedule, isHost)}
                                            className="h-12 rounded-full bg-black px-8 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >
                                            {getApplyButtonText(schedule, isHost)}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={enterChatRoom}
                                            disabled={!canEnterChat}
                                            className="h-12 rounded-full border border-gray-200 px-8 text-sm font-bold text-gray-950 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            채팅방 입장
                                        </button>

                                        {!isHost && (
                                            <div className="flex h-12 items-center justify-center rounded-full border border-gray-200 px-8 text-sm font-bold transition hover:bg-gray-50 sm:col-span-2">
                                                <UserActionTrigger
                                                    memberId={schedule.hostMemberId}
                                                    nickname="호스트 회원"
                                                >
                                                    <span>호스트 프로필</span>
                                                </UserActionTrigger>
                                            </div>
                                        )}

                                        {canCancelParticipation && (
                                            <button
                                                type="button"
                                                onClick={handleCancelMyParticipation}
                                                className="h-12 rounded-full border border-red-100 px-8 text-sm font-bold text-red-500 transition hover:bg-red-50 sm:col-span-2"
                                            >
                                                신청 취소
                                            </button>
                                        )}

                                        {isHost && schedule.status === "OPEN" && (
                                            <button
                                                type="button"
                                                onClick={handleCloseRecruitment}
                                                disabled={isRecruitmentChanging}
                                                className="h-12 rounded-full border border-amber-100 px-8 text-sm font-bold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 sm:col-span-2"
                                            >
                                                {isRecruitmentChanging ? "처리 중..." : "모집 마감"}
                                            </button>
                                        )}

                                        {isHost && schedule.status === "CLOSED" && (
                                            <button
                                                type="button"
                                                onClick={handleReopenRecruitment}
                                                disabled={isRecruitmentChanging}
                                                className="h-12 rounded-full border border-emerald-100 px-8 text-sm font-bold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 sm:col-span-2"
                                            >
                                                {isRecruitmentChanging ? "처리 중..." : "모집 재개"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mx-auto grid max-w-6xl gap-10 px-8 py-12 lg:grid-cols-[1fr_360px]">
                            <div>
                                <div className="grid gap-px overflow-hidden border border-gray-200 bg-gray-200 md:grid-cols-2">
                                    <DetailItem label="일시" value={formatDateTime(schedule.scheduledAt)} />
                                    <DetailItem label="지역" value={schedule.region} />
                                    <DetailItem label="만남 장소" value={schedule.meetingPlace} />
                                    <DetailItem
                                        label="예상 시간"
                                        value={schedule.expectedDurationMinutes ? `${schedule.expectedDurationMinutes}분` : "미입력"}
                                    />
                                    <DetailItem
                                        label="참여 인원"
                                        value={`${schedule.currentParticipantCount}/${schedule.maxParticipants}명`}
                                    />
                                    <DetailItem label="대기 신청" value={`${schedule.pendingRequestCount}건`} />
                                    <DetailItem label="선호 크기" value={formatDogSize(schedule.preferredDogSize)} />
                                    <DetailItem
                                        label="내 신청 상태"
                                        value={formatParticipantStatus(schedule.myParticipantStatus)}
                                    />
                                </div>

                                <div className="mt-10 border-y border-gray-200 py-8">
                                    <p className="text-sm font-bold tracking-[0.3em] text-gray-400">
                                        PREFERRED PERSONALITY
                                    </p>
                                    <p className="mt-4 text-lg font-semibold leading-8 text-gray-900">
                                        {schedule.preferredPersonality || "제한 없음"}
                                    </p>
                                </div>
                            </div>

                            <aside className="border border-gray-200 p-6">
                                <p className="text-sm font-bold text-gray-400">모집 현황</p>
                                <div className="mt-6">
                                    <p className="text-4xl font-bold text-gray-950">
                                        {schedule.currentParticipantCount}
                                        <span className="text-lg text-gray-400"> / {schedule.maxParticipants}명</span>
                                    </p>
                                    <div className="mt-5 h-2 bg-gray-100">
                                        <div
                                            className="h-full bg-gray-950"
                                            style={{
                                                width: `${Math.min((schedule.currentParticipantCount / schedule.maxParticipants) * 100, 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-5 text-sm leading-6 text-gray-500">
                                        승인된 참여자와 호스트를 포함한 현재 인원입니다.
                                        대기 중인 신청은 호스트가 승인해야 참여 인원에 반영됩니다.
                                    </p>
                                </div>
                            </aside>
                        </section>

                        {isHost && (
                            <section className="mx-auto max-w-6xl px-8 pb-16">
                                <HostParticipantPanel
                                    participants={participants}
                                    isLoading={isParticipantsLoading}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            </section>
                        )}

                        <section className="mx-auto max-w-6xl px-8 pb-20">
                            <WalkReviewPanel
                                reviews={reviews}
                                canWriteReview={canWriteReview}
                                targetOptions={reviewTargetOptions}
                                form={reviewForm}
                                isSubmitting={isReviewSubmitting}
                                onChange={handleReviewChange}
                                onSubmit={handleCreateReview}
                            />
                        </section>
                    </>
                )}
            </main>

            {isApplyModalOpen && schedule && (
                <ApplyWalkModal
                    schedule={schedule}
                    dogs={verifiedDogs}
                    form={applyForm}
                    isSubmitting={isSubmitting}
                    onChange={handleApplyChange}
                    onClose={() => setIsApplyModalOpen(false)}
                    onSubmit={handleApply}
                />
            )}
        </>
    );
}

// 상세 정보 항목
