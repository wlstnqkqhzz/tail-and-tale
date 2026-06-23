// 마이페이지 대시보드 항목

import { InfoBadge, StatusBadge } from "../walk/WalkBadges";
import { formatDateTime, formatDogSize, formatParticipantStatus } from "../../utils/walkFormat";
import { formatDateOnly, renderRating } from "../../utils/profileComplete";

export function DashboardSection({ title, count, emptyText, actionLabel, onAction, children }) {
    return (
        <section className="pt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-950">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">총 {count}건</p>
                </div>

                <button type="button"
                    onClick={onAction}
                    className="h-10 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                >
                    {actionLabel}
                </button>
            </div>

            {count === 0 ? (
                <div className="flex h-32 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : children}
        </section>
    );
}

// 반려견 카드
export function DogCard({ dog, onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-gray-950">{dog.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{dog.breed || "견종 미입력"}</p>
                </div>
                <InfoBadge label={dog.isVerified ? "인증" : "미인증"} tone={dog.isVerified ? "green" : "amber"} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <MiniInfo label="크기" value={formatDogSize(dog.size)} />
                <MiniInfo label="몸무게" value={dog.weight ? `${dog.weight}kg` : "미입력"} />
            </div>
        </button>
    );
}

// 산책 행
export function WalkRow({ schedule, participation, showParticipantStatus = false, onClick, onCancel }) {
    const item = schedule || participation;
    const canCancel = Boolean(participation && ["REQUESTED", "APPROVED"].includes(participation.status));

    return (
        <div className="grid gap-4 border border-gray-200 p-5 transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]">
            <button type="button" onClick={onClick} className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                    {schedule && <StatusBadge status={item.status} />}
                    {showParticipantStatus && (
                        <InfoBadge label={formatParticipantStatus(item.status)} tone="blue" />
                    )}
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-gray-950">{item.title}</h3>
                <p className="mt-1 truncate text-sm text-gray-500">{item.meetingPlace}</p>
            </button>

            <div className="min-w-0">
                <div className="text-sm text-gray-500 md:text-right">
                <p>{formatDateTime(item.scheduledAt)}</p>
                <p className="mt-1 font-semibold text-gray-900">
                    {item.currentParticipantCount}/{item.maxParticipants}명
                </p>
                </div>

                {canCancel && (
                    <button type="button"
                        onClick={onCancel}
                        className="mt-3 h-9 w-full border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50"
                    >
                        신청 취소
                    </button>
                )}
            </div>
        </div>
    );
}

// 채팅방 행
export function ChatRoomRow({ chatRoom, onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="grid gap-4 border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]"
        >
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                    <InfoBadge label={chatRoom.myRole === "HOST" ? "호스트" : "참여자"} />
                    <InfoBadge label={chatRoom.status === "ACTIVE" ? "진행 중" : "종료"} tone="green" />
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-gray-950">{chatRoom.walkTitle}</h3>
                <p className="mt-1 truncate text-sm text-gray-500">
                    {chatRoom.lastMessage?.content || "아직 메시지가 없습니다."}
                </p>
            </div>

            <div className="text-sm text-gray-400 md:text-right">
                {chatRoom.lastMessage?.createdAt
                    ? formatDateTime(chatRoom.lastMessage.createdAt)
                    : "새 채팅방"}
            </div>
        </button>
    );
}

// 산책 후기 그룹
export function ReviewGroup({ title, reviews, emptyText, onClick }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                <span className="text-sm font-bold text-gray-400">{reviews.length}건</span>
            </div>

            {reviews.length === 0 ? (
                <div className="flex h-24 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-3">
                    {reviews.slice(0, 4).map((review) => (
                        <button
                            key={review.walkReviewId}
                            type="button"
                            onClick={() => onClick(review)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <p className="text-sm font-bold text-gray-400">
                                {review.walkTitle} · {formatDateOnly(review.createdAt)}
                            </p>
                            <h4 className="mt-2 text-lg font-bold text-gray-950">
                                {renderRating(review.rating)} {review.rating}점
                            </h4>
                            <p className="mt-2 text-sm text-gray-500">
                                {review.reviewerNickname} → {review.revieweeNickname}
                            </p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                                {review.content || "후기 내용이 없습니다."}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// 커뮤니티 활동 그룹
export function CommunityGroup({ title, items, emptyText, type, onClick }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                <span className="text-sm font-bold text-gray-400">{items.length}건</span>
            </div>

            {items.length === 0 ? (
                <div className="flex h-24 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-3">
                    {items.slice(0, 4).map((item) => (
                        <button
                            key={type === "post" ? item.communityPostId : item.commentId}
                            type="button"
                            onClick={() => onClick(item)}
                            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
                        >
                            <p className="text-sm font-bold text-gray-400">
                                {formatDateOnly(item.createdAt)}
                            </p>
                            <h4 className="mt-2 line-clamp-1 text-lg font-bold text-gray-950">
                                {type === "post" ? item.title : item.communityPostTitle}
                            </h4>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                                {type === "post" ? `댓글 ${item.commentCount} · 추천 ${item.likeCount}` : item.content}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// 케어 기록 행
export function CareGroup({ title, count, emptyText, actionLabel, onAction, children }) {
    return (
        <section className="border border-gray-200 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{count}건</p>
                </div>

                <button
                    type="button"
                    onClick={onAction}
                    className="h-9 shrink-0 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                >
                    {actionLabel}
                </button>
            </div>

            {count === 0 ? (
                <div className="flex h-24 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-3">{children}</div>
            )}
        </section>
    );
}

// 케어 기록 행
export function CareRow({ title, meta, content, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="border border-gray-200 p-5 text-left transition hover:border-gray-950 hover:shadow-lg"
        >
            <p className="text-sm font-bold text-gray-400">{meta}</p>
            <h3 className="mt-2 line-clamp-1 text-lg font-bold text-gray-950">{title}</h3>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{content}</p>
        </button>
    );
}

// 입력 필드

function MiniInfo({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className="mt-1 truncate font-semibold text-gray-800">{value || "미입력"}</p>
        </div>
    );
}
