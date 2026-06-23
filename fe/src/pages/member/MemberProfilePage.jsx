import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import { blockMember, getMemberMiniProfile } from "../../api/member";
import { createReport } from "../../api/report";
import ReportModal from "../../components/report/ReportModal";
import { formatDogSize } from "../../utils/walkFormat";

// 공개 회원 프로필 페이지

export default function MemberProfilePage() {
    const navigate = useNavigate();
    const { memberId } = useParams();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);

    useEffect(() => {
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
    }, [memberId]);

    const displayNickname = profile?.nickname || "알 수 없음";
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
            alert("회원을 차단했습니다.");
            navigate(-1);
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
                targetId: Number(memberId),
                reason,
                content,
            });

            alert("신고가 접수되었습니다.");
            setIsReportOpen(false);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "신고 접수에 실패했습니다.");
        } finally {
            setIsReportSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-950">
            <Header />

            <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
                {isLoading ? (
                    <div className="flex h-80 items-center justify-center border border-gray-200 text-sm text-gray-400">
                        프로필을 불러오는 중...
                    </div>
                ) : !profile ? (
                    <div className="flex h-80 flex-col items-center justify-center border border-gray-200 text-center">
                        <p className="text-2xl font-bold">프로필을 찾을 수 없습니다.</p>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mt-6 h-11 rounded-full bg-black px-6 text-sm font-bold text-white transition hover:opacity-80"
                        >
                            돌아가기
                        </button>
                    </div>
                ) : (
                    <>
                        <section className="border-b border-gray-200 pb-14">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mb-10 text-sm font-bold text-gray-400 transition hover:text-gray-950"
                            >
                                돌아가기
                            </button>

                            <div className="grid gap-10 md:grid-cols-[1fr_280px] md:items-end">
                                <div>
                                    <div className="mb-8 grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-4xl">
                                        {profile.profileImageUrl ? (
                                            <img
                                                src={profile.profileImageUrl}
                                                alt={displayNickname}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            "🐶"
                                        )}
                                    </div>

                                    <p className="mb-4 text-xs font-bold tracking-[0.35em] text-emerald-600">
                                        MEMBER PROFILE
                                    </p>
                                    <h1 className="text-4xl font-black leading-tight md:text-6xl">
                                        {displayNickname}님의 프로필
                                    </h1>
                                    <p className="mt-6 text-lg font-bold text-gray-500">
                                        {[profile.region, dogLabel].filter(Boolean).join(" / ")}
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <button
                                        type="button"
                                        onClick={handleBlock}
                                        className="h-12 border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50"
                                    >
                                        차단하기
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsReportOpen(true)}
                                        className="h-12 bg-black text-sm font-bold text-white transition hover:opacity-80"
                                    >
                                        신고하기
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-8 py-12 md:grid-cols-[1.4fr_1fr]">
                            <div className="border border-gray-200 p-7">
                                <p className="text-xs font-bold tracking-[0.28em] text-gray-400">INTRODUCTION</p>
                                <p className="mt-5 whitespace-pre-line text-base leading-8 text-gray-700">
                                    {profile.introduction || "아직 작성된 소개가 없습니다."}
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <ProfileStat
                                    label="신뢰도"
                                    value={`${profile.trustScore ?? 60}점`}
                                    description={formatTrustLevel(profile.trustLevel)}
                                />
                                <ProfileStat label="산책 참여" value={`${profile.walkParticipationCount ?? 0}회`} />
                                <ProfileStat label="신고 이력" value="비공개" />
                            </div>
                        </section>

                        <section className="border-t border-gray-200 py-12">
                            <div className="mb-7 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.28em] text-gray-400">BADGES</p>
                                    <h2 className="mt-3 text-3xl font-black">획득한 뱃지</h2>
                                </div>
                                <p className="text-sm font-bold text-gray-400">
                                    {profile.badges?.length ?? 0}개
                                </p>
                            </div>

                            {profile.badges?.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {profile.badges.map((badge) => (
                                        <div key={badge.badgeId} className="border border-emerald-100 bg-emerald-50/50 p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-emerald-600">
                                                    {badge.iconUrl ? (
                                                        <img
                                                            src={badge.iconUrl}
                                                            alt={badge.name}
                                                            className="h-full w-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        "B"
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-950">{badge.name}</p>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                                        {badge.description || badge.earnedReason || "획득한 뱃지입니다."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-gray-200 p-8 text-sm text-gray-400">
                                    아직 획득한 뱃지가 없습니다.
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <ReportModal
                isOpen={isReportOpen}
                targetLabel={`${displayNickname} 회원`}
                isSubmitting={isReportSubmitting}
                onClose={() => setIsReportOpen(false)}
                onSubmit={handleReport}
            />
        </div>
    );
}

function ProfileStat({ label, value, description }) {
    return (
        <div className="border border-gray-200 p-6">
            <p className="text-sm font-bold text-gray-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-gray-950">{value}</p>
            {description && (
                <p className="mt-2 text-sm font-bold text-emerald-600">{description}</p>
            )}
        </div>
    );
}

function formatTrustLevel(trustLevel) {
    switch (trustLevel) {
        case "TRUSTED":
            return "믿음직한 산책 메이트";
        case "NORMAL":
            return "안정적인 보호자";
        case "CAUTION":
            return "조금 더 확인이 필요해요";
        case "LOW":
            return "주의가 필요한 상태";
        default:
            return "안정적인 보호자";
    }
}
