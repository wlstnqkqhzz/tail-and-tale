// 산책 상세 화면 컴포넌트

import { UserActionTrigger } from "../member/UserMiniProfileModal";
import { StatusBadge } from "./WalkBadges";
import { formatReviewDate, renderRating } from "../../utils/walkDetail";

export function DetailItem({ label, value }) {
    return (
        <div className="bg-white p-5">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-2 break-words text-base font-semibold text-gray-900">{value || "미입력"}</p>
        </div>
    );
}

// 호스트 신청자 관리 패널
export function HostParticipantPanel({ participants, isLoading, onApprove, onReject }) {
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
                                    <UserActionTrigger
                                        memberId={participant.memberId}
                                        nickname={participant.nickname}
                                        profileImageUrl={participant.profileImageUrl}
                                    />
                                    <StatusBadge status={participant.status} type="participant" />
                                </div>

                                <p className="mt-1 text-sm text-gray-500">
                                    {participant.dogName}와 함께 신청
                                </p>

                                <p className="mt-4 break-words bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                                    {participant.message || "신청 메시지가 없습니다."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:w-48 md:self-start">
                                {participant.status === "REQUESTED" && (
                                    <>
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
                                    </>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 산책 후기 패널
export function WalkReviewPanel({ reviews, canWriteReview, targetOptions, form, isSubmitting, onChange, onSubmit }) {
    return (
        <div className="border-t border-gray-200 pt-10">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-bold tracking-[0.3em] text-gray-400">WALK REVIEW</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">산책 후기</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        함께 산책한 메이트에게 후기를 남기고 신뢰도를 쌓아보세요.
                    </p>
                </div>

                <span className="text-sm font-bold text-gray-500">{reviews.length}건</span>
            </div>

            {canWriteReview && targetOptions.length > 0 && (
                <form onSubmit={onSubmit} className="mb-8 grid gap-4 border border-gray-200 p-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                        <label className="grid gap-2 text-sm font-bold text-gray-700">
                            후기 대상
                            <select
                                name="revieweeId"
                                value={form.revieweeId}
                                onChange={onChange}
                                className="input"
                            >
                                {targetOptions.map((target) => (
                                    <option key={target.memberId} value={target.memberId}>
                                        {target.nickname}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-gray-700">
                            평점
                            <select
                                name="rating"
                                value={form.rating}
                                onChange={onChange}
                                className="input"
                            >
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <option key={rating} value={rating}>
                                        {rating}점
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="grid gap-2 text-sm font-bold text-gray-700">
                        후기 내용
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={onChange}
                            maxLength={1000}
                            className="textarea"
                            placeholder="함께 산책한 경험을 남겨주세요"
                        />
                    </label>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 bg-black px-7 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isSubmitting ? "등록 중..." : "후기 등록"}
                        </button>
                    </div>
                </form>
            )}

            {canWriteReview && targetOptions.length === 0 && (
                <div className="mb-8 border border-dashed border-gray-200 p-5 text-sm text-gray-400">
                    후기를 남길 수 있는 다른 참여자가 없습니다.
                </div>
            )}

            {reviews.length === 0 ? (
                <div className="flex h-32 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    아직 작성된 후기가 없습니다.
                </div>
            ) : (
                <div className="grid gap-3">
                    {reviews.map((review) => (
                        <div key={review.walkReviewId} className="border border-gray-200 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-950">
                                        {renderRating(review.rating)} {review.rating}점
                                    </h3>
                                </div>

                                <p className="text-sm text-gray-400">{formatReviewDate(review.createdAt)}</p>
                            </div>

                            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
                                {review.content || "후기 내용이 없습니다."}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 산책 신청 모달
export function ApplyWalkModal({ schedule, dogs, form, isSubmitting, onChange, onClose, onSubmit }) {
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
