import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportModal from "../report/ReportModal";
import { blockMember, getMemberMiniProfile } from "../../api/member";
import { createReport } from "../../api/report";
import { formatDogSize } from "../../utils/walkFormat";

export function UserActionTrigger({ memberId, nickname, profileImageUrl, disabled = false, children }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!memberId || disabled) {
        return children || <span>{nickname}</span>;
    }

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(true);
                }}
                className="inline-flex items-center gap-2 text-left font-bold text-gray-950 transition hover:text-emerald-700"
            >
                {children || (
                    <>
                        {profileImageUrl && (
                            <img
                                src={profileImageUrl}
                                alt={nickname || "회원"}
                                className="h-7 w-7 rounded-full object-cover"
                            />
                        )}
                        <span>{nickname || "알 수 없음"}</span>
                    </>
                )}
            </button>

            <UserMiniProfileModal
                memberId={memberId}
                fallbackNickname={nickname}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}

export default function UserMiniProfileModal({ memberId, fallbackNickname, isOpen, onClose }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen || !memberId) {
            return;
        }

        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const response = await getMemberMiniProfile(memberId);

                setProfile(response.data);
            } catch (error) {
                console.error(error);
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isOpen, memberId]);

    if (!isOpen) {
        return null;
    }

    const displayNickname = profile?.nickname || fallbackNickname || "알 수 없음";
    const dogLabel = profile?.representativeDogSize
        ? `${formatDogSize(profile.representativeDogSize)} 보호자`
        : "반려견 보호자";

    const handleBlock = async () => {
        const reason = window.prompt("차단 사유를 입력해주세요. 비워두어도 차단할 수 있습니다.");

        if (reason === null || !window.confirm(`${displayNickname}님을 차단할까요?`)) {
            return;
        }

        try {
            await blockMember(memberId, { reason: reason.trim() });
            alert("회원이 차단되었습니다.");
            onClose();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "회원 차단에 실패했습니다.");
        }
    };

    const handleReport = async ({ reason, content }) => {
        try {
            setIsReportSubmitting(true);
            await createReport({
                targetType: "MEMBER",
                targetId: memberId,
                reason,
                content,
            });

            alert("신고가 접수되었습니다.");
            setIsReportOpen(false);
            onClose();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "신고 접수에 실패했습니다.");
        } finally {
            setIsReportSubmitting(false);
        }
    };

    const handleViewProfile = () => {
        onClose();
        navigate(`/members/${memberId}`);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6" onClick={onClose}>
                <div
                    className="w-full max-w-sm border border-gray-200 bg-white p-6 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    {isLoading ? (
                        <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                            프로필을 불러오는 중...
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-2xl">
                                    {profile?.profileImageUrl ? (
                                        <img
                                            src={profile.profileImageUrl}
                                            alt={displayNickname}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        "🐶"
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-bold text-gray-950">{displayNickname}</h2>
                                    <p className="mt-1 text-sm font-bold text-gray-500">
                                        {[profile?.region, dogLabel].filter(Boolean).join(" / ")}
                                    </p>
                                </div>
                            </div>

                            {profile?.introduction && (
                                <p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-600">
                                    {profile.introduction}
                                </p>
                            )}

                            <div className="mt-5 grid gap-2 border-y border-gray-100 py-4 text-sm text-gray-600">
                                <p>
                                    신뢰도 <strong className="text-gray-950">{profile?.trustScore ?? 60}점</strong>
                                    <span className="ml-2 text-xs font-bold text-emerald-600">
                                        {formatTrustLevel(profile?.trustLevel)}
                                    </span>
                                </p>
                                <p>
                                    산책 참여 <strong className="text-gray-950">{profile?.walkParticipationCount ?? 0}회</strong>
                                </p>
                                <p>신고 이력 비공개</p>
                            </div>

                            {profile?.badges?.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {profile.badges.slice(0, 3).map((badge) => (
                                        <span
                                            key={badge.badgeId}
                                            className="inline-flex h-8 items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
                                            title={badge.description || badge.name}
                                        >
                                            {badge.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-5 grid gap-2">
                                <button
                                    type="button"
                                    onClick={handleViewProfile}
                                    className="h-11 border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
                                >
                                    프로필 보기
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBlock}
                                    className="h-11 border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50"
                                >
                                    차단하기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsReportOpen(true)}
                                    className="h-11 bg-black text-sm font-bold text-white transition hover:opacity-80"
                                >
                                    신고하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={isReportOpen}
                targetLabel={`${displayNickname} 회원`}
                isSubmitting={isReportSubmitting}
                onClose={() => setIsReportOpen(false)}
                onSubmit={handleReport}
            />
        </>
    );
}

function formatTrustLevel(trustLevel) {
    switch (trustLevel) {
        case "TRUSTED":
            return "믿음직함";
        case "NORMAL":
            return "보통";
        case "CAUTION":
            return "주의";
        case "LOW":
            return "낮음";
        default:
            return "보통";
    }
}
