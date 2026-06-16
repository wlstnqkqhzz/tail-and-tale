// 산책 게시글 상세 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import { InfoBadge, StatusBadge } from "../components/walk/WalkBadges";
import { getDogs } from "../api/dog";
import {
    approveWalkParticipant,
    getWalkParticipants,
    getWalkSchedule,
    rejectWalkParticipant,
    requestWalkParticipation,
} from "../api/walk";
import { useAuth } from "../hooks/useAuth";
import { getAccessToken } from "../utils/token";
import { formatDateTime, formatDogSize, formatParticipantStatus } from "../utils/walkFormat";

const initialApplyForm = {
    dogId: "",
    message: "",
};

export default function WalkDetailPage() {
    const navigate = useNavigate();
    const { walkScheduleId } = useParams();
    const { member } = useAuth();

    // 산책 상세 상태
    const [schedule, setSchedule] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [dogs, setDogs] = useState([]);

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applyForm, setApplyForm] = useState(initialApplyForm);

    const isHost = Boolean(member && schedule?.hostMemberId === member.memberId);

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
            fetchDogs();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchDogs, fetchScheduleDetail, navigate]);

    // 호스트일 때만 신청자 목록 조회
    useEffect(() => {
        const timerId = window.setTimeout(() => {
            if (!schedule || !isHost) {
                setParticipants([]);
                return;
            }

            fetchParticipants();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchParticipants, isHost, schedule]);

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

        setApplyForm({
            dogId: String(dogs[0].dogId),
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

    // 산책 참여 신청
    const handleApply = async (event) => {
        event.preventDefault();

        if (!applyForm.dogId) {
            alert("참여할 반려견을 선택해주세요.");
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
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openApplyModal}
                                        disabled={!canApply(schedule, isHost)}
                                        className="h-12 rounded-full bg-black px-8 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {getApplyButtonText(schedule, isHost)}
                                    </button>
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
                    </>
                )}
            </main>

            {isApplyModalOpen && schedule && (
                <ApplyWalkModal
                    schedule={schedule}
                    dogs={dogs}
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
function DetailItem({ label, value }) {
    return (
        <div className="bg-white p-5">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-2 break-words text-base font-semibold text-gray-900">{value || "미입력"}</p>
        </div>
    );
}

// 호스트 신청자 관리 패널
function HostParticipantPanel({ participants, isLoading, onApprove, onReject }) {
    return (
        <div className="border-t border-gray-200 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold tracking-[0.3em] text-gray-400">HOST ONLY</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">신청자 관리</h2>
                </div>

                <span className="text-sm font-bold text-gray-500">{participants.length}건</span>
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center border border-gray-200 text-sm text-gray-400">
                    신청자 목록을 불러오는 중...
                </div>
            ) : participants.length === 0 ? (
                <div className="flex h-32 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    아직 신청자가 없습니다.
                </div>
            ) : (
                <div className="grid gap-3">
                    {participants.map((participant) => (
                        <div
                            key={participant.walkParticipantId}
                            className="grid gap-4 border border-gray-200 p-5 md:grid-cols-[1fr_auto]"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-bold text-gray-950">{participant.nickname}</p>
                                    <StatusBadge status={participant.status} type="participant" />
                                </div>

                                <p className="mt-1 text-sm text-gray-500">
                                    {participant.dogName}와 함께 신청
                                </p>

                                <p className="mt-4 break-words bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                                    {participant.message || "신청 메시지가 없습니다."}
                                </p>
                            </div>

                            {participant.status === "REQUESTED" && (
                                <div className="grid grid-cols-2 gap-2 md:w-40 md:self-start">
                                    <button
                                        type="button"
                                        onClick={() => onReject(participant.walkParticipantId)}
                                        className="h-11 border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
                                    >
                                        거절
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onApprove(participant.walkParticipantId)}
                                        className="h-11 bg-black text-sm font-bold text-white transition hover:opacity-80"
                                    >
                                        승인
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 산책 신청 모달
function ApplyWalkModal({ schedule, dogs, form, isSubmitting, onChange, onClose, onSubmit }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-lg bg-white p-7 shadow-xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">산책 참여 신청</h2>
                    <p className="mt-2 text-sm text-gray-500">{schedule.title}</p>
                </div>

                <form onSubmit={onSubmit} className="grid gap-4">
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        참여 반려견
                        <select
                            name="dogId"
                            value={form.dogId}
                            onChange={onChange}
                            className="h-12 border border-gray-200 px-4 text-base outline-none transition focus:border-black"
                        >
                            {dogs.map((dog) => (
                                <option key={dog.dogId} value={dog.dogId}>
                                    {dog.name} {dog.isVerified ? "(인증)" : ""}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        신청 메시지
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={onChange}
                            maxLength={300}
                            className="min-h-28 resize-none border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black"
                            placeholder="호스트에게 전달할 메시지를 입력해주세요"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
                        >
                            취소
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isSubmitting ? "신청 중..." : "신청하기"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function canApply(schedule, isHost) {
    return schedule.isRecruitable
        && !isHost
        && !["REQUESTED", "APPROVED"].includes(schedule.myParticipantStatus);
}

function getApplyButtonText(schedule, isHost) {
    if (isHost) return "호스트";
    if (schedule.myParticipantStatus === "REQUESTED") return "신청 대기 중";
    if (schedule.myParticipantStatus === "APPROVED") return "참여 승인됨";
    if (!schedule.isRecruitable) return "신청 불가";
    return "참여 신청";
}
